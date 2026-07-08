import type { SimulationModule } from '../../modules/types';
import { departsLoaded, trafficLabel2, type TrafficTypeTag2 } from './types';

/**
 * Baustein: zählt Physisch -1 bei jeder tatsächlichen Ausfahrt **einer
 * Brücke** (nicht jeder LKW-Ausfahrt!) - erkennbar daran, dass der LKW beim
 * Verlassen noch eine Ladeeinheit gekoppelt hat (Sammelgut/Nahverkehr
 * Ausgang, Leerbrücke Ausgang). Sammelgut/Nahverkehr Eingang fahren dagegen
 * leer wieder raus (ihre Brücke steht bereits am Hof, z.B. bei LEWB) - das
 * darf Physisch nicht verändern. Zusätzlich System -1 für Sammelgut/
 * Nahverkehr Ausgang (deren Ladeeinheit verlässt endgültig die Niederlassung).
 * Muss nach dem Movement-Baustein und vor Cleanup laufen, da Cleanup
 * abgefahrene LKW aus dem State entfernt.
 */
export function createScenario2DepartureCounterModule(): SimulationModule {
  return {
    id: 'scenario2-departure-counter',
    label: 'Szenario-2-Abfahrtszähler',
    description: 'Physisch -1, wenn eine Brücke den Hof verlässt; zusätzlich System -1 für Sammelgut/Nahverkehr Ausgang.',
    onTick(ctx) {
      const { state, log } = ctx;
      for (const truck of Object.values(state.trucks)) {
        if (truck.status !== 'departed' || !truck.pickupTag) continue;
        const tag = truck.pickupTag as TrafficTypeTag2;
        state.records.push({ tag, kind: 'ausfahrt', time: state.time });

        if (!truck.cargo) {
          log(`${truck.id} verlässt die Niederlassung leer (${trafficLabel2(tag)})`);
          continue;
        }

        state.counters.physical = (state.counters.physical ?? 0) - 1;
        if (departsLoaded(tag)) {
          state.counters.system = (state.counters.system ?? 0) - 1;
          log(`${truck.id} verlässt die Niederlassung mit ${trafficLabel2(tag)} - Physisch -1, System -1`);
        } else {
          log(`${truck.id} verlässt die Niederlassung mit ${trafficLabel2(tag)} - Physisch -1`);
        }
      }
    },
  };
}
