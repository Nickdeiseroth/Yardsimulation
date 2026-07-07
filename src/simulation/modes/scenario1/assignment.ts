import { findAvailableCargoSlot, findFreeSlot } from '../../util';
import type { SimulationModule } from '../../modules/types';
import { arrivesViaGate } from './types';

export interface Scenario1AssignmentConfig {
  /** Fahrzeit vom Gate zum Ziel-Slot, in Minuten. */
  travelMinutes: number;
}

const DEFAULT_CONFIG: Scenario1AssignmentConfig = { travelMinutes: 8 };

/**
 * Baustein: routet LKW am Gate je nach Verkehrstyp - Sgut/NV zu einer freien
 * Laderampe (Tor), Leere Brücke Eingang direkt zu einem freien LEWB-Platz,
 * Abholfahrten (Leere Brücke Ausgang) zu dem LEWB-Platz, auf dem die passende
 * Ladeeinheit bereits steht.
 */
export function createScenario1AssignmentModule(config: Partial<Scenario1AssignmentConfig> = {}): SimulationModule {
  const cfg = { ...DEFAULT_CONFIG, ...config };

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

        truck.targetSlotId = targetSlot.id;
        truck.status = 'moving';
        state.movements[truckId] = { remaining: cfg.travelMinutes, total: cfg.travelMinutes };
        const existing = state.slotOccupancy[targetSlot.id];
        state.slotOccupancy[targetSlot.id] = { ...existing, truckId };
        log(`${truckId} fährt zu ${targetSlot.id}`);
      }
      state.gateQueue = stillWaiting;
    },
  };
}
