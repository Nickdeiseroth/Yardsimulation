import { GATE_EXIT } from '../state';
import type { SimulationModule } from './types';

/** Baustein: lässt LKW, die unterwegs sind, ihre Fahrzeit "abfahren" und kommt am Ziel an. */
export function createMovementModule(): SimulationModule {
  return {
    id: 'standard-movement',
    label: 'Standard-Bewegung',
    description: 'Reduziert die Restfahrzeit bewegter LKW pro Tick und meldet Ankunft am Ziel-Slot bzw. Gate.',
    onTick(ctx) {
      const { state, dt, log } = ctx;
      for (const [truckId, movement] of Object.entries(state.movements)) {
        const next = movement.remaining - dt;
        const truck = state.trucks[truckId];
        if (!truck) {
          delete state.movements[truckId];
          continue;
        }
        if (next > 0) {
          movement.remaining = next;
          continue;
        }
        delete state.movements[truckId];

        if (truck.targetSlotId === GATE_EXIT) {
          truck.status = 'departed';
          truck.currentSlotId = undefined;
          log(`${truckId} verlässt den Yard${truck.cargo ? ` mit ${truck.cargo.type} ${truck.cargo.id}` : ' leer (Solo)'}`);
          continue;
        }

        if (truck.targetSlotId) {
          truck.currentSlotId = truck.targetSlotId;
          truck.targetSlotId = undefined;
          const slot = state.slotOccupancy[truck.currentSlotId];
          if (slot) slot.truckId = truckId;
          truck.status = 'at-dock';
          log(`${truckId} hat Rampe ${truck.currentSlotId} erreicht`);
        }
      }
    },
  };
}
