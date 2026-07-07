import type { SimulationModule } from './types';

/** Baustein: entfernt LKW mit Status 'departed' aus dem aktiven State (Historie bleibt im Event-Log). */
export function createCleanupModule(): SimulationModule {
  return {
    id: 'standard-cleanup',
    label: 'Standard-Aufräumen',
    description: 'Entfernt LKW, die den Yard verlassen haben, aus dem aktiven Bestand.',
    onTick(ctx) {
      const { state } = ctx;
      for (const truck of Object.values(state.trucks)) {
        if (truck.status === 'departed') delete state.trucks[truck.id];
      }
    },
  };
}
