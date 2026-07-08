import { buildRouteFromSlot, travelMinutesFor } from '../../domain/roadNetwork';
import { findAvailableCargoSlot } from '../util';
import { GATE_EXIT } from '../state';
import type { SimulationModule } from './types';

export interface DwellDepartureModuleConfig {
  /** Lade-/Entladezeit an der Rampe, in Minuten. */
  dwellMinutes: number;
}

const DEFAULT_CONFIG: DwellDepartureModuleConfig = { dwellMinutes: 25 };

/**
 * Baustein: LKW an der Rampe entladen/beladen, koppeln danach - falls verfügbar -
 * eine leere Ladeeinheit aus LEWB (Wechselbrücke) bzw. SA (Sattelauflieger) und
 * fahren zurück zum Gate. Ohne verfügbare Ladeeinheit fährt der LKW solo (Bobtail) ab.
 */
export function createDwellDepartureModule(config: Partial<DwellDepartureModuleConfig> = {}): SimulationModule {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    id: 'standard-dwell-departure',
    label: 'Standard-Verweildauer & Abfahrt',
    description: `Entladen/Beladen an der Rampe (${cfg.dwellMinutes} min), danach Kopplung einer leeren Ladeeinheit falls vorhanden und Rückfahrt zum Gate.`,
    onTick(ctx) {
      const { state, layout, dt, log } = ctx;

      for (const truck of Object.values(state.trucks)) {
        if (truck.status !== 'at-dock' || !truck.currentSlotId) continue;

        if (!(truck.id in state.dwellTimers)) {
          state.dwellTimers[truck.id] = cfg.dwellMinutes;
          continue;
        }

        const remaining = state.dwellTimers[truck.id] - dt;
        if (remaining > 0) {
          state.dwellTimers[truck.id] = remaining;
          continue;
        }
        delete state.dwellTimers[truck.id];

        const dockSlotId = truck.currentSlotId;
        const dockSlot = layout.slots.find((s) => s.id === dockSlotId)!;
        const droppedCargo = truck.cargo;
        truck.cargo = undefined;

        if (droppedCargo) {
          // Ladeeinheit bleibt zunächst allein an der Rampe stehen (truckId entfernt) -
          // ein Rangier-Baustein (shunting) holt sie später ab, siehe modules/shunting.ts.
          state.slotOccupancy[dockSlotId] = { cargoId: droppedCargo.id };
          log(`${truck.id} entkoppelt ${droppedCargo.type} ${droppedCargo.id} an Rampe ${dockSlotId}`);
        } else {
          delete state.slotOccupancy[dockSlotId];
        }

        if (droppedCargo) {
          const returnZone = droppedCargo.type === 'wechselbruecke' ? 'lewb' : 'sa';
          const returnSlot = findAvailableCargoSlot(layout, state, returnZone, droppedCargo.type);
          if (returnSlot) {
            const returnCargo = state.cargoUnits[state.slotOccupancy[returnSlot.id].cargoId!];
            truck.cargo = returnCargo;
            delete state.slotOccupancy[returnSlot.id];
            log(`${truck.id} koppelt ${returnCargo.type} ${returnCargo.id} aus ${returnZone.toUpperCase()} (${returnSlot.id})`);
          }
        }

        // currentSlotId bleibt bewusst gesetzt (= Ausgangsrampe), damit die
        // Visualisierung die Rückfahrt-Route rekonstruieren kann; movement.ts
        // räumt es erst bei Ankunft am Gate auf.
        const travelMinutes = travelMinutesFor(buildRouteFromSlot(dockSlot));
        truck.targetSlotId = GATE_EXIT;
        truck.status = 'moving';
        state.movements[truck.id] = { remaining: travelMinutes, total: travelMinutes };
        log(`${truck.id} fährt zurück zum Gate (${travelMinutes} min)`);
      }
    },
  };
}
