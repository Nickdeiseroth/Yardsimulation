import { findFreeSlot } from '../util';
import type { SimulationModule } from './types';

/**
 * Baustein: modelliert den Rangierdienst (PPRD) abstrakt - eine an der Rampe
 * "herrenlos" abgestellte Ladeeinheit (kein LKW mehr gekoppelt) wird nach einer
 * Verzögerung in ihre Lagerzone verbracht (Wechselbrücke -> LEWB, Sattelauflieger -> SA)
 * und gibt damit die Rampe für den nächsten LKW frei.
 *
 * Vereinfachung v1: kein eigener Rangier-LKW als Entität, keine Fahrzeit modelliert.
 * Ein künftiger Baustein kann das ersetzen durch einen echten Shunter mit eigener
 * Kapazität/Fahrzeit, ohne dass andere Module angepasst werden müssen.
 */
export function createShuntingModule(): SimulationModule {
  return {
    id: 'standard-shunting',
    label: 'Standard-Rangierdienst',
    description: 'Bringt an der Rampe zurückgelassene Ladeeinheiten in die zugehörige Lagerzone (LEWB/SA) und gibt die Rampe frei.',
    onTick(ctx) {
      const { state, layout, log } = ctx;
      for (const [slotId, occ] of Object.entries(state.slotOccupancy)) {
        if (occ.truckId || !occ.cargoId) continue;
        const slot = layout.slots.find((s) => s.id === slotId);
        if (slot?.zoneId !== 'dock') continue;

        const cargo = state.cargoUnits[occ.cargoId];
        if (!cargo) continue;
        const destZone = cargo.defect ? 'def' : cargo.type === 'wechselbruecke' ? 'lewb' : 'sa';
        const freeSlot = findFreeSlot(layout, state, destZone, cargo.type);
        if (!freeSlot) continue;

        delete state.slotOccupancy[slotId];
        state.slotOccupancy[freeSlot.id] = { cargoId: cargo.id };
        log(`Rangierdienst bringt ${cargo.id} von Rampe ${slotId} nach ${freeSlot.id} (${destZone.toUpperCase()})`);
      }
    },
  };
}
