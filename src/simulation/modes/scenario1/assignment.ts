import { buildRouteToSlot, travelMinutesFor } from '../../../domain/roadNetwork';
import { findAvailableCargoSlot, findFreeSlot } from '../../util';
import type { SimulationModule } from '../../modules/types';
import { arrivesViaGate } from './types';

/**
 * Baustein: routet LKW am Gate je nach Verkehrstyp - Sgut/NV zu einer freien
 * Laderampe (Tor), Leere Brücke Eingang direkt zu einem freien LEWB-Platz,
 * Abholfahrten (Leere Brücke Ausgang) zu dem LEWB-Platz, auf dem die passende
 * Ladeeinheit bereits steht. Fahrzeit richtet sich nach der tatsächlichen
 * Streckenlänge über die Ringstraße.
 */
export function createScenario1AssignmentModule(): SimulationModule {
  return {
    id: 'scenario1-assignment',
    label: 'Szenario-1-Zuweisung',
    description: 'Sgut/NV -> Tor, Leere Brücke Eingang -> direkt LEWB, Leere Brücke Ausgang -> Abholung bei LEWB.',
    onTick(ctx) {
      const { state, layout, log } = ctx;
      if (state.gateQueue.length === 0) return;

      const stillWaiting: string[] = [];
      for (const truckId of state.gateQueue) {
        const truck = state.trucks[truckId];
        if (!truck) continue;

        const targetSlot = truck.pickupTag === 'leer-aus'
          ? findAvailableCargoSlot(layout, state, 'lewb', 'wechselbruecke', (c) => c.reference === 'leer-aus')
          : arrivesViaGate(truck.cargo?.reference)
            ? findFreeSlot(layout, state, 'dock', 'wechselbruecke')
            : truck.cargo?.reference === 'leer-ein'
              ? findFreeSlot(layout, state, 'lewb', 'wechselbruecke')
              : undefined;

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
