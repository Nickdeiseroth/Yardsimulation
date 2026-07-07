import type { SimulationModule } from '../../modules/types';

/**
 * Baustein: zählt Physisch -1, sobald eine "Leere Brücke Ausgang" den Hof
 * tatsächlich verlässt (LKW-Status wird in diesem Tick 'departed'). Muss nach
 * dem Movement-Baustein und vor Cleanup laufen, da Cleanup abgefahrene LKW
 * aus dem State entfernt.
 */
export function createScenario1DepartureCounterModule(): SimulationModule {
  return {
    id: 'scenario1-departure-counter',
    label: 'Szenario-1-Abfahrtszähler',
    description: 'Zählt Physisch -1, sobald eine abgeholte "Leere Brücke Ausgang" den Hof verlässt.',
    onTick(ctx) {
      const { state, log } = ctx;
      for (const truck of Object.values(state.trucks)) {
        if (truck.status === 'departed' && truck.pickupTag === 'leer-aus') {
          state.counters.physical = (state.counters.physical ?? 0) - 1;
          log(`${truck.id} verlässt den Hof mit einer Leeren Brücke Ausgang - Physisch -1`);
        }
      }
    },
  };
}
