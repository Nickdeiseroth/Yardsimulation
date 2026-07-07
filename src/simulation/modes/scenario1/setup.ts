import { findFreeSlot } from '../../util';
import type { SimulationModule } from '../../modules/types';
import type { Scenario1Config } from './types';

/**
 * Baustein (nur onInit): platziert die konfigurierte Anzahl "Leere Brücke
 * Ausgang" sofort bei LEWB (bereits als Physisch/System gezählt, da sie zu
 * Szenario-Beginn schon auf dem Hof stehen) und baut die Warteliste der noch
 * eintreffenden Fahrzeuge auf (im Rundlauf über die übrigen Verkehrstypen).
 */
export function createScenario1SetupModule(config: Scenario1Config): SimulationModule {
  return {
    id: 'scenario1-setup',
    label: 'Szenario-1-Aufbau',
    description: 'Platziert "Leere Brücke Ausgang" vorab bei LEWB und plant die übrigen Ankünfte in einer Warteliste.',
    onInit(ctx) {
      const { state, layout, log } = ctx;
      state.counters.physical = 0;
      state.counters.system = 0;

      for (let i = 0; i < config.leerAus; i++) {
        const slot = findFreeSlot(layout, state, 'lewb', 'wechselbruecke');
        if (!slot) {
          log('Kein freier LEWB-Platz mehr für "Leere Brücke Ausgang" - Szenario-Konfiguration prüfen.');
          break;
        }
        const cargoId = `CU-${state.nextCargoSeq++}`;
        state.cargoUnits[cargoId] = { id: cargoId, type: 'wechselbruecke', reference: 'leer-aus', defect: false };
        state.slotOccupancy[slot.id] = { cargoId };
        state.counters.physical += 1;
        state.counters.system += 1;
        log(`${cargoId} (Leere Brücke Ausgang) steht bereits bei ${slot.id} - Physisch +1, System +1`);
      }

      const remaining = { sgut: config.sgut, nv: config.nv, leerEin: config.leerEin, leerAus: config.leerAus };
      const maxCount = Math.max(remaining.sgut, remaining.nv, remaining.leerEin, remaining.leerAus);
      const queue: string[] = [];
      for (let round = 0; round < maxCount; round++) {
        if (remaining.sgut > 0) { queue.push('sgut'); remaining.sgut--; }
        if (remaining.nv > 0) { queue.push('nv'); remaining.nv--; }
        if (remaining.leerEin > 0) { queue.push('leer-ein'); remaining.leerEin--; }
        if (remaining.leerAus > 0) { queue.push('leer-aus'); remaining.leerAus--; }
      }
      state.spawnQueue = queue;
    },
    onTick() {
      // Reine Einmal-Initialisierung, siehe onInit.
    },
  };
}
