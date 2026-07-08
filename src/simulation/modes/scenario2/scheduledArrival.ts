import { randomPlate } from '../../util';
import type { SimulationModule } from '../../modules/types';
import { trafficLabel2, type TrafficTypeTag2 } from './types';

const STARTS_WITH_CARGO: Record<TrafficTypeTag2, boolean> = {
  sge: true,
  nve: true,
  le: true,
  sga: false,
  nva: false,
  la: false,
};

/**
 * Baustein: löst geplante Ankünfte/Abfahrten aus `state.scheduledSpawns` aus,
 * sobald die Simulationszeit den geplanten Zeitpunkt erreicht (kann pro Tick
 * mehrere gleichzeitig fällige Einträge abarbeiten). Jede Einfahrt zählt
 * Physisch +1 (gilt für alle Verkehrsarten gleichermaßen).
 */
export function createScenario2ArrivalModule(): SimulationModule {
  return {
    id: 'scenario2-arrival',
    label: 'Szenario-2-Ankunft',
    description: 'Löst geplante Ankünfte/Abfahrten zur vorgesehenen Uhrzeit aus (Physisch +1 bei jeder Einfahrt).',
    onTick(ctx) {
      const { state, rng, log } = ctx;

      while (state.scheduledSpawns.length > 0 && state.scheduledSpawns[0].time <= state.time) {
        const entry = state.scheduledSpawns.shift()!;
        const tag = entry.tag as TrafficTypeTag2;
        const truckId = `LKW-${state.nextTruckSeq++}`;

        if (STARTS_WITH_CARGO[tag]) {
          const cargoId = `CU-${state.nextCargoSeq++}`;
          state.cargoUnits[cargoId] = { id: cargoId, type: 'wechselbruecke', reference: tag, defect: false };
          state.trucks[truckId] = {
            id: truckId,
            licensePlate: randomPlate(rng),
            status: 'en-route-to-gate',
            cargo: state.cargoUnits[cargoId],
            pickupTag: tag,
          };
        } else {
          state.trucks[truckId] = {
            id: truckId,
            licensePlate: randomPlate(rng),
            status: 'en-route-to-gate',
            pickupTag: tag,
          };
        }

        state.gateQueue.push(truckId);
        state.counters.physical = (state.counters.physical ?? 0) + 1;
        state.records.push({ tag, kind: 'einfahrt', time: state.time });
        log(`${truckId} (${trafficLabel2(tag)}) fährt auf den Hof - Physisch +1`);
      }
    },
  };
}
