import { randomPlate } from '../../util';
import type { SimulationModule } from '../../modules/types';
import { trafficTypeLabel, type TrafficTypeTag } from './types';

export interface ScriptedArrivalConfig {
  /** Abstand zwischen zwei ausgelösten Ankünften aus der Warteliste, in Minuten. */
  intervalMinutes: number;
}

const DEFAULT_CONFIG: ScriptedArrivalConfig = { intervalMinutes: 20 };

/** Baustein: löst in festem Takt die nächste geplante Ankunft aus `state.spawnQueue` aus. */
export function createScriptedArrivalModule(config: Partial<ScriptedArrivalConfig> = {}): SimulationModule {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    id: 'scenario1-arrival',
    label: 'Szenario-1-Ankunft',
    description: `Löst alle ${cfg.intervalMinutes} min die nächste geplante Ankunft aus der Warteliste aus.`,
    onTick(ctx) {
      const { state, dt, rng, log } = ctx;
      if (state.spawnQueue.length === 0) return;

      const prevBucket = Math.floor((state.time - dt) / cfg.intervalMinutes);
      const currBucket = Math.floor(state.time / cfg.intervalMinutes);
      if (currBucket <= prevBucket) return;

      const tag = state.spawnQueue.shift() as TrafficTypeTag;
      const truckId = `LKW-${state.nextTruckSeq++}`;

      if (tag === 'leer-aus') {
        state.trucks[truckId] = {
          id: truckId,
          licensePlate: randomPlate(rng),
          status: 'en-route-to-gate',
          pickupTag: 'leer-aus',
        };
        state.gateQueue.push(truckId);
        log(`${truckId} kommt am Gate an, um eine ${trafficTypeLabel(tag)} bei LEWB abzuholen`);
        return;
      }

      const cargoId = `CU-${state.nextCargoSeq++}`;
      state.cargoUnits[cargoId] = { id: cargoId, type: 'wechselbruecke', reference: tag, defect: false };
      state.trucks[truckId] = {
        id: truckId,
        licensePlate: randomPlate(rng),
        status: 'en-route-to-gate',
        cargo: state.cargoUnits[cargoId],
      };
      state.gateQueue.push(truckId);
      state.counters.physical = (state.counters.physical ?? 0) + 1;
      log(`${truckId} (${trafficTypeLabel(tag)}) fährt auf den Hof - Physisch +1`);
    },
  };
}
