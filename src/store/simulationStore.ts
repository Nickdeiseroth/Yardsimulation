import { create } from 'zustand';
import { yardLayout } from '../domain/yardLayout';
import { SimulationEngine } from '../simulation/engine';
import { createStandardMode } from '../simulation/modes/standardMode';
import type { SimulationState } from '../simulation/state';
import type { SimulationModule } from '../simulation/modules/types';

export interface SimulationModeDefinition {
  id: string;
  label: string;
  description: string;
  build: () => SimulationModule[];
}

/** Registry der verfügbaren Baukasten-Modi. Weitere Modi werden hier ergänzt. */
export const availableModes: SimulationModeDefinition[] = [
  {
    id: 'standard',
    label: 'Standardbetrieb',
    description: 'Grundkreislauf: Ankunft -> Rampe -> Laden/Entladen -> Rückladung -> Abfahrt.',
    build: () => createStandardMode(),
  },
];

const TICKS_PER_SECOND_AT_SPEED_1 = 1;

interface SimulationStoreState {
  engine: SimulationEngine;
  snapshot: SimulationState;
  modeId: string;
  running: boolean;
  /** Geschwindigkeitsfaktor der Wiedergabe (1 = 1 Tick/s). */
  speed: number;
  intervalHandle: ReturnType<typeof setInterval> | null;

  step: () => void;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  reset: () => void;
  setMode: (modeId: string) => void;
}

function snapshotOf(engine: SimulationEngine): SimulationState {
  return structuredClone(engine.state);
}

export const useSimulationStore = create<SimulationStoreState>((set, get) => {
  const engine = new SimulationEngine({ layout: yardLayout, modules: createStandardMode() });

  return {
    engine,
    snapshot: snapshotOf(engine),
    modeId: 'standard',
    running: false,
    speed: 1,
    intervalHandle: null,

    step: () => {
      get().engine.tick();
      set({ snapshot: snapshotOf(get().engine) });
    },

    play: () => {
      if (get().intervalHandle) return;
      const handle = setInterval(() => {
        get().engine.tick();
        set({ snapshot: snapshotOf(get().engine) });
      }, 1000 / (TICKS_PER_SECOND_AT_SPEED_1 * get().speed));
      set({ running: true, intervalHandle: handle });
    },

    pause: () => {
      const handle = get().intervalHandle;
      if (handle) clearInterval(handle);
      set({ running: false, intervalHandle: null });
    },

    setSpeed: (speed) => {
      set({ speed });
      if (get().running) {
        get().pause();
        get().play();
      }
    },

    reset: () => {
      get().pause();
      const modeDef = availableModes.find((m) => m.id === get().modeId) ?? availableModes[0];
      get().engine.setModules(modeDef.build());
      get().engine.reset();
      set({ snapshot: snapshotOf(get().engine) });
    },

    setMode: (modeId) => {
      const modeDef = availableModes.find((m) => m.id === modeId);
      if (!modeDef) return;
      get().pause();
      get().engine.setModules(modeDef.build());
      get().engine.reset();
      set({ modeId, snapshot: snapshotOf(get().engine) });
    },
  };
});
