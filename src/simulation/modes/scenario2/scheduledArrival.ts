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
 * mehrere gleichzeitig fällige Einträge abarbeiten).
 *
 * Physisch zählt Wechselbrücken, nicht LKW: Sammelgut/Nahverkehr Ausgang und
 * Leerbrücke Ausgang kommen als leere Zugmaschine auf den Hof (die Brücke,
 * die sie später mitnehmen, steht dort schon und wurde bereits gezählt) -
 * deshalb gibt es hier nur dann Physisch +1, wenn tatsächlich eine Brücke
 * mit einfährt (siehe departureCounter.ts für die spiegelbildliche Abfahrt-Logik).
 */
export function createScenario2ArrivalModule(): SimulationModule {
  return {
    id: 'scenario2-arrival',
    label: 'Szenario-2-Ankunft',
    description: 'Löst geplante Ankünfte/Abfahrten zur vorgesehenen Uhrzeit aus (Physisch +1, wenn eine Brücke mit einfährt).',
    onTick(ctx) {
      const { state, rng, log } = ctx;

      while (state.scheduledSpawns.length > 0 && state.scheduledSpawns[0].time <= state.time) {
        const entry = state.scheduledSpawns.shift()!;
        const tag = entry.tag as TrafficTypeTag2;
        const truckId = `LKW-${state.nextTruckSeq++}`;
        const startsWithCargo = STARTS_WITH_CARGO[tag];

        if (startsWithCargo) {
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
        state.records.push({ tag, kind: 'einfahrt', time: state.time });
        if (startsWithCargo) {
          state.counters.physical = (state.counters.physical ?? 0) + 1;
          log(`${truckId} (${trafficLabel2(tag)}) fährt mit Brücke auf den Hof - Physisch +1`);
        } else {
          log(`${truckId} (${trafficLabel2(tag)}) fährt leer auf den Hof, um eine Brücke abzuholen`);
        }
      }
    },
  };
}
