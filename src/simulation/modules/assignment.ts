import { buildRouteToSlot, travelMinutesFor } from '../../domain/roadNetwork';
import { findFreeSlot } from '../util';
import type { SimulationModule } from './types';

/** Baustein: weist wartenden LKW am Gate eine freie Laderampe zu. */
export function createAssignmentModule(): SimulationModule {
  return {
    id: 'standard-assignment',
    label: 'Standard-Rampenzuweisung',
    description: 'Weist LKW am Gate die nächste freie passende Laderampe zu (Fahrzeit richtet sich nach der tatsächlichen Streckenlänge).',
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
        const travelMinutes = travelMinutesFor(buildRouteToSlot(freeSlot));
        truck.targetSlotId = freeSlot.id;
        truck.status = 'moving';
        state.movements[truckId] = { remaining: travelMinutes, total: travelMinutes };
        state.slotOccupancy[freeSlot.id] = { truckId };
        log(`${truckId} fährt zu Rampe ${freeSlot.id} (${travelMinutes} min)`);
      }
      state.gateQueue = stillWaiting;
    },
  };
}
