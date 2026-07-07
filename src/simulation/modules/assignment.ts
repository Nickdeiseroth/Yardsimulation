import { findFreeSlot } from '../util';
import type { SimulationModule } from './types';

export interface AssignmentModuleConfig {
  /** Fahrzeit vom Gate zu einer Rampe, in Minuten. */
  travelMinutesToDock: number;
}

const DEFAULT_CONFIG: AssignmentModuleConfig = { travelMinutesToDock: 8 };

/** Baustein: weist wartenden LKW am Gate eine freie Laderampe zu. */
export function createAssignmentModule(config: Partial<AssignmentModuleConfig> = {}): SimulationModule {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    id: 'standard-assignment',
    label: 'Standard-Rampenzuweisung',
    description: `Weist LKW am Gate die nächste freie passende Laderampe zu (Fahrzeit ${cfg.travelMinutesToDock} min).`,
    onTick(ctx) {
      const { state, layout, log } = ctx;
      if (state.gateQueue.length === 0) return;

      const stillWaiting: string[] = [];
      for (const truckId of state.gateQueue) {
        const truck = state.trucks[truckId];
        if (!truck?.cargo) {
          stillWaiting.push(truckId);
          continue;
        }
        const freeSlot = findFreeSlot(layout, state, 'dock', truck.cargo.type);
        if (!freeSlot) {
          stillWaiting.push(truckId);
          continue;
        }
        truck.targetSlotId = freeSlot.id;
        truck.status = 'moving';
        state.movements[truckId] = cfg.travelMinutesToDock;
        state.slotOccupancy[freeSlot.id] = { truckId };
        log(`${truckId} fährt zu Rampe ${freeSlot.id}`);
      }
      state.gateQueue = stillWaiting;
    },
  };
}
