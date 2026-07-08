import { findFreeSlot } from '../../util';
import type { SimulationModule } from '../../modules/types';
import {
  DAY_MINUTES,
  pickRandomTimeInWindows,
  RANDOM_COUNT_RANGE,
  TRAFFIC_WINDOWS,
  trafficLabel2,
  type Scenario2Config,
  type TrafficTypeTag2,
} from './types';

const TRAFFIC_TYPES: TrafficTypeTag2[] = ['sge', 'sga', 'nva', 'nve', 'le', 'la'];

/**
 * Baustein (nur onInit): platziert den konfigurierten Hofbestand (bereits im
 * System gebucht) vorab bei LEWB und würfelt für jede Verkehrsart die
 * Ankunfts-/Abfahrtszeitpunkte innerhalb ihres Zeitfensters - entweder mit
 * den vom Nutzer manuell gesetzten Stückzahlen, oder (Zufallsmodus)
 * automatisch mit einer zufälligen, plausiblen Stückzahl je Art.
 */
export function createScenario2SetupModule(config: Scenario2Config): SimulationModule {
  return {
    id: 'scenario2-setup',
    label: 'Szenario-2-Aufbau',
    description: 'Platziert den Hofbestand bei LEWB und plant alle Ankünfte/Abfahrten für die kommenden 24 Stunden.',
    onInit(ctx) {
      const { state, layout, rng, log } = ctx;
      state.counters.physical = 0;
      state.counters.system = 0;

      for (let i = 0; i < config.hofbestand; i++) {
        const slot = findFreeSlot(layout, state, 'lewb', 'wechselbruecke');
        if (!slot) {
          log('Kein freier LEWB-Platz mehr für den Hofbestand - Anzahl prüfen.');
          break;
        }
        const cargoId = `CU-${state.nextCargoSeq++}`;
        state.cargoUnits[cargoId] = { id: cargoId, type: 'wechselbruecke', reference: 'hofbestand', defect: false };
        state.slotOccupancy[slot.id] = { cargoId };
        state.counters.physical += 1;
        state.counters.system += 1;
        state.records.push({ tag: 'hofbestand', kind: 'bestand', time: 0 });
      }
      log(`Hofbestand: ${config.hofbestand} Wechselbrücken bei LEWB eingebucht (Physisch/System +${config.hofbestand}).`);

      const schedule: { time: number; tag: string }[] = [];
      for (const tag of TRAFFIC_TYPES) {
        const count = config.mode === 0
          ? Math.floor(rng() * (RANDOM_COUNT_RANGE[1] - RANDOM_COUNT_RANGE[0] + 1)) + RANDOM_COUNT_RANGE[0]
          : config[tag];
        for (let i = 0; i < count; i++) {
          const time = pickRandomTimeInWindows(rng, TRAFFIC_WINDOWS[tag]);
          schedule.push({ time, tag });
        }
        log(`${trafficLabel2(tag)}: ${count} geplant.`);
      }
      schedule.sort((a, b) => a.time - b.time);
      state.scheduledSpawns = schedule.filter((entry) => entry.time < DAY_MINUTES);
    },
    onTick() {
      // Reine Einmal-Initialisierung, siehe onInit.
    },
  };
}
