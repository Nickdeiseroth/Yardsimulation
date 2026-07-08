import { buildRouteBetweenSlots, buildRouteFromSlot, travelMinutesFor } from '../../../domain/roadNetwork';
import { findFreeSlotInIdRange } from '../../util';
import { GATE_EXIT } from '../../state';
import type { SimulationModule } from '../../modules/types';
import { arrivesLoaded, departsLoaded, GATE_RANGES, trafficLabel2, type TrafficTypeTag2 } from './types';

export interface Scenario2DwellConfig {
  /** Lade-/Entladezeit am Tor, in Minuten. */
  dwellMinutes: number;
}

const DEFAULT_CONFIG: Scenario2DwellConfig = { dwellMinutes: 20 };

/**
 * Baustein: verarbeitet am Zielort angekommene LKW - je nach Verkehrsart und
 * Zwischenstopp unterschiedlich:
 * - Sammelgut/Nahverkehr Ausgang an LEWB (noch ohne Ladung): koppelt eine
 *   Leerbrücke und fährt **weiter zum Tor**, statt zurück zum Gate - aber nur,
 *   wenn dort gerade eine Rampe frei ist (sonst wird an LEWB gewartet).
 * - Leerbrücke Ausgang an LEWB: koppelt eine Leerbrücke und fährt direkt zum Gate.
 * - Leerbrücke Eingang an LEWB: stellt die Brücke ab (kein Tor, kein System-Zähler)
 *   und fährt leer zum Gate zurück.
 * - Sammelgut/Nahverkehr Eingang am Tor: zählt System +1 **sofort beim
 *   Erreichen** des Tors (nicht erst nach der Entladezeit - "sobald die
 *   Brücke am Tor ist"), wartet danach die Entladezeit ab, entkoppelt die
 *   Brücke (wird später zu LEWB verbracht) und fährt leer zum Gate zurück.
 * - Sammelgut/Nahverkehr Ausgang am Tor: wartet die Ladezeit ab und fährt
 *   dann **mit** der Brücke zum Gate raus (System-Buchung erfolgt erst bei
 *   tatsächlicher Ausfahrt, siehe departureCounter.ts).
 */
export function createScenario2DwellDepartureModule(config: Partial<Scenario2DwellConfig> = {}): SimulationModule {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  return {
    id: 'scenario2-dwell-departure',
    label: 'Szenario-2-Verweildauer & Abfahrt',
    description: `Be-/Entladen am Tor (${cfg.dwellMinutes} min), Kopplung/Entkopplung bei LEWB, mehrstufige Fahrten für Ausgangsverkehr.`,
    onTick(ctx) {
      const { state, layout, dt, log } = ctx;

      for (const truck of Object.values(state.trucks)) {
        if (truck.status !== 'at-dock' || !truck.currentSlotId || !truck.pickupTag) continue;
        const tag = truck.pickupTag as TrafficTypeTag2;
        const slot = layout.slots.find((s) => s.id === truck.currentSlotId);
        if (!slot) continue;

        // --- Ausgangsverkehr, Zwischenstopp bei LEWB: Leerbrücke koppeln ---
        if (!truck.cargo && slot.zoneId === 'lewb') {
          const occ = state.slotOccupancy[truck.currentSlotId];
          const cargo = occ?.cargoId ? state.cargoUnits[occ.cargoId] : undefined;
          if (!cargo) continue;

          if (departsLoaded(tag)) {
            const range = GATE_RANGES[tag]!;
            const torSlot = findFreeSlotInIdRange(layout, state, 'dock', 'wechselbruecke', range[0], range[1]);
            if (!torSlot) continue; // wartet bei LEWB, bis eine Rampe frei wird

            truck.cargo = cargo;
            delete state.slotOccupancy[truck.currentSlotId];
            const travelMinutes = travelMinutesFor(buildRouteBetweenSlots(slot, torSlot));
            state.slotOccupancy[torSlot.id] = { truckId: truck.id, cargoId: cargo.id };
            truck.targetSlotId = torSlot.id;
            truck.status = 'moving';
            state.movements[truck.id] = { remaining: travelMinutes, total: travelMinutes };
            log(`${truck.id} koppelt ${cargo.id} (${trafficLabel2(cargo.reference)}) bei ${slot.id} und fährt zu Tor ${torSlot.id}`);
            continue;
          }

          // Leerbrücke Ausgang: direkt zum Gate.
          truck.cargo = cargo;
          delete state.slotOccupancy[truck.currentSlotId];
          const travelMinutes = travelMinutesFor(buildRouteFromSlot(slot));
          truck.targetSlotId = GATE_EXIT;
          truck.status = 'moving';
          state.movements[truck.id] = { remaining: travelMinutes, total: travelMinutes };
          log(`${truck.id} koppelt ${cargo.id} (${trafficLabel2(cargo.reference)}) bei ${slot.id} und fährt zum Gate`);
          continue;
        }

        if (!truck.cargo) continue;

        // --- Leerbrücke Eingang: sofort bei LEWB abstellen, kein Tor ---
        if (tag === 'le' && slot.zoneId === 'lewb') {
          const droppedCargo = truck.cargo;
          truck.cargo = undefined;
          state.slotOccupancy[truck.currentSlotId] = { cargoId: droppedCargo.id };
          const travelMinutes = travelMinutesFor(buildRouteFromSlot(slot));
          truck.targetSlotId = GATE_EXIT;
          truck.status = 'moving';
          state.movements[truck.id] = { remaining: travelMinutes, total: travelMinutes };
          log(`${truck.id} stellt ${droppedCargo.id} bei ${slot.id} ab und fährt leer zum Gate`);
          continue;
        }

        // --- Am Tor: Be-/Entladen abwarten ---
        if (slot.zoneId === 'dock') {
          if (!(truck.id in state.dwellTimers)) {
            state.dwellTimers[truck.id] = cfg.dwellMinutes;
            // "Sobald die Brücke am Tor ist" - die Systembuchung erfolgt beim
            // Erreichen des Tors, nicht erst nach Ablauf der Entladezeit.
            if (arrivesLoaded(tag)) {
              state.counters.system = (state.counters.system ?? 0) + 1;
              log(`${truck.id} (${trafficLabel2(tag)}) erreicht Tor ${slot.id} - System +1`);
            }
            continue;
          }
          const remaining = state.dwellTimers[truck.id] - dt;
          if (remaining > 0) {
            state.dwellTimers[truck.id] = remaining;
            continue;
          }
          delete state.dwellTimers[truck.id];

          if (arrivesLoaded(tag)) {
            const droppedCargo = truck.cargo;
            truck.cargo = undefined;
            state.slotOccupancy[truck.currentSlotId] = { cargoId: droppedCargo.id };
            log(`${truck.id} (${trafficLabel2(tag)}) hat entladen, Brücke steht an Rampe ${slot.id}`);
          } else {
            // departsLoaded: Brücke bleibt gekoppelt, fährt mit dem LKW raus.
            log(`${truck.id} (${trafficLabel2(tag)}) ist beladen und verlässt Tor ${slot.id}`);
            delete state.slotOccupancy[truck.currentSlotId];
          }

          const travelMinutes = travelMinutesFor(buildRouteFromSlot(slot));
          truck.targetSlotId = GATE_EXIT;
          truck.status = 'moving';
          state.movements[truck.id] = { remaining: travelMinutes, total: travelMinutes };
        }
      }
    },
  };
}
