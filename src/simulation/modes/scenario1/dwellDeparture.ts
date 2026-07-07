import { GATE_EXIT } from '../../state';
import type { SimulationModule } from '../../modules/types';
import { trafficTypeLabel } from './types';

export interface Scenario1DwellConfig {
  /** Verweildauer am Tor, bevor die Ladeeinheit als "eingetroffen" gilt (System +1). */
  torDwellMinutes: number;
  /** Fahrzeit zurück zum Gate, in Minuten. */
  travelMinutesToGate: number;
}

const DEFAULT_CONFIG: Scenario1DwellConfig = { torDwellMinutes: 15, travelMinutesToGate: 8 };

/**
 * Baustein: verarbeitet am Zielort angekommene LKW.
 * - Abholfahrt (Leere Brücke Ausgang): koppelt sofort die dort stehende
 *   Ladeeinheit und fährt direkt zum Gate.
 * - Sgut/NV am Tor: wartet die Verweildauer ab, zählt danach System +1,
 *   entkoppelt die Ladeeinheit an der Rampe und fährt leer zum Gate zurück.
 * - Leere Brücke Eingang bei LEWB: entkoppelt sofort (kein Tor, kein System-Zähler)
 *   und fährt leer zum Gate zurück.
 */
export function createScenario1DwellDepartureModule(config: Partial<Scenario1DwellConfig> = {}): SimulationModule {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    id: 'scenario1-dwell-departure',
    label: 'Szenario-1-Verweildauer & Abfahrt',
    description: `Zählt System +1 beim Erreichen eines Tors (nach ${cfg.torDwellMinutes} min), koppelt/entkoppelt Ladung und schickt LKW leer zurück zum Gate.`,
    onTick(ctx) {
      const { state, layout, dt, log } = ctx;

      for (const truck of Object.values(state.trucks)) {
        if (truck.status !== 'at-dock' || !truck.currentSlotId) continue;
        const slot = layout.slots.find((s) => s.id === truck.currentSlotId);
        if (!slot) continue;

        if (truck.pickupTag === 'leer-aus') {
          const occ = state.slotOccupancy[truck.currentSlotId];
          const cargo = occ?.cargoId ? state.cargoUnits[occ.cargoId] : undefined;
          if (cargo) {
            truck.cargo = cargo;
            log(`${truck.id} koppelt ${cargo.id} (${trafficTypeLabel(cargo.reference)}) bei ${slot.id} und fährt zum Gate`);
          }
          delete state.slotOccupancy[truck.currentSlotId];
          truck.targetSlotId = GATE_EXIT;
          truck.status = 'moving';
          state.movements[truck.id] = { remaining: cfg.travelMinutesToGate, total: cfg.travelMinutesToGate };
          continue;
        }

        if (!truck.cargo) continue;

        if (slot.zoneId === 'dock') {
          if (!(truck.id in state.dwellTimers)) {
            state.dwellTimers[truck.id] = cfg.torDwellMinutes;
            continue;
          }
          const remaining = state.dwellTimers[truck.id] - dt;
          if (remaining > 0) {
            state.dwellTimers[truck.id] = remaining;
            continue;
          }
          delete state.dwellTimers[truck.id];
          state.counters.system = (state.counters.system ?? 0) + 1;
          log(`${truck.id} (${trafficTypeLabel(truck.cargo.reference)}) erreicht Tor ${slot.id} - System +1`);
        }

        const droppedCargo = truck.cargo;
        truck.cargo = undefined;
        state.slotOccupancy[truck.currentSlotId] = { cargoId: droppedCargo.id };
        log(`${truck.id} stellt ${droppedCargo.id} bei ${slot.id} ab und fährt leer zum Gate`);

        truck.targetSlotId = GATE_EXIT;
        truck.status = 'moving';
        state.movements[truck.id] = { remaining: cfg.travelMinutesToGate, total: cfg.travelMinutesToGate };
      }
    },
  };
}
