import type { CargoUnitType } from '../../domain/types';
import { randomPlate } from '../util';
import type { SimulationModule } from './types';

export interface ArrivalModuleConfig {
  /** Erwartete Ankünfte pro Stunde (Poisson-artig). */
  arrivalRatePerHour: number;
  /** Anteil Wechselbrücken an allen Ankünften (Rest = Sattelauflieger), 0..1. */
  swapBodyShare: number;
}

const DEFAULT_CONFIG: ArrivalModuleConfig = {
  arrivalRatePerHour: 6,
  swapBodyShare: 0.5,
};

/** Baustein: erzeugt LKW mit gekoppelter Ladeeinheit am Gate. */
export function createArrivalModule(config: Partial<ArrivalModuleConfig> = {}): SimulationModule {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    id: 'standard-arrival',
    label: 'Standard-Ankunft',
    description: `Poisson-Ankünfte am Gate (~${cfg.arrivalRatePerHour}/h), Ladung ${Math.round(cfg.swapBodyShare * 100)}% Wechselbrücke / ${Math.round((1 - cfg.swapBodyShare) * 100)}% Sattelauflieger.`,
    onTick(ctx) {
      const { state, rng, dt, log } = ctx;
      const meanPerTick = (cfg.arrivalRatePerHour / 60) * dt;
      if (rng() >= meanPerTick) return;

      const cargoType: CargoUnitType = rng() < cfg.swapBodyShare ? 'wechselbruecke' : 'sattelauflieger';
      const cargoId = `CU-${state.nextCargoSeq++}`;
      state.cargoUnits[cargoId] = { id: cargoId, type: cargoType, defect: false };

      const truckId = `LKW-${state.nextTruckSeq++}`;
      state.trucks[truckId] = {
        id: truckId,
        licensePlate: randomPlate(rng),
        status: 'en-route-to-gate',
        cargo: state.cargoUnits[cargoId],
      };
      state.gateQueue.push(truckId);
      log(`${truckId} (${state.trucks[truckId].licensePlate}) kommt am Gate an, geladen mit ${cargoType} ${cargoId}`);
    },
  };
}
