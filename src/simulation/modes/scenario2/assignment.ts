import { buildRouteToSlot, travelMinutesFor } from '../../../domain/roadNetwork';
import { findAvailableCargoSlot, findFreeSlot, findFreeSlotInIdRange } from '../../util';
import type { SimulationModule } from '../../modules/types';
import { GATE_RANGES, type TrafficTypeTag2 } from './types';

/**
 * Baustein: routet LKW am Gate je nach Verkehrsart.
 * - Sammelgut/Nahverkehr Eingang, Leerbrücke Eingang: haben bereits Ladung ->
 *   Sammelgut/Nahverkehr zum passenden Tor-Nummernbereich, Leerbrücke direkt zu LEWB.
 * - Sammelgut/Nahverkehr Ausgang, Leerbrücke Ausgang: noch ohne Ladung -> erst
 *   zu einer beliebigen freien Ladeeinheit bei LEWB (welche genau, ist egal -
 *   Herkunft bleibt über `cargo.reference` nachvollziehbar).
 */
export function createScenario2AssignmentModule(): SimulationModule {
  return {
    id: 'scenario2-assignment',
    label: 'Szenario-2-Zuweisung',
    description: 'Sammelgut/Nahverkehr Eingang -> passendes Tor, Leerbrücke Eingang -> LEWB, alle Ausgänge -> Abholung bei LEWB.',
    onTick(ctx) {
      const { state, layout, log } = ctx;
      if (state.gateQueue.length === 0) return;

      const stillWaiting: string[] = [];
      for (const truckId of state.gateQueue) {
        const truck = state.trucks[truckId];
        if (!truck?.pickupTag) continue;
        const tag = truck.pickupTag as TrafficTypeTag2;

        const targetSlot = truck.cargo
          ? tag === 'le'
            ? findFreeSlot(layout, state, 'lewb', 'wechselbruecke')
            : (() => {
                const range = GATE_RANGES[tag];
                return range ? findFreeSlotInIdRange(layout, state, 'dock', 'wechselbruecke', range[0], range[1]) : undefined;
              })()
          : findAvailableCargoSlot(layout, state, 'lewb', 'wechselbruecke');

        if (!targetSlot) {
          stillWaiting.push(truckId);
          continue;
        }

        const travelMinutes = travelMinutesFor(buildRouteToSlot(targetSlot));
        truck.targetSlotId = targetSlot.id;
        truck.status = 'moving';
        state.movements[truckId] = { remaining: travelMinutes, total: travelMinutes };
        const existing = state.slotOccupancy[targetSlot.id];
        state.slotOccupancy[targetSlot.id] = { ...existing, truckId };
        log(`${truckId} fährt zu ${targetSlot.id} (${travelMinutes} min)`);
      }
      state.gateQueue = stillWaiting;
    },
  };
}
