import { create } from 'zustand';
import { yardLayout } from '../domain/yardLayout';
import { SimulationEngine } from '../simulation/engine';
import { createStandardMode } from '../simulation/modes/standardMode';
import { createScenario1Mode, SCENARIO1_DEFAULTS } from '../simulation/modes/scenario1';
import type { SimulationState } from '../simulation/state';
import type { SimulationModule } from '../simulation/modules/types';

/** Ein einzelnes Eingabefeld einer Modus-Konfigurationsmaske. */
export interface ScenarioFieldDefinition {
  key: string;
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
}

/** Ein im Modus geführter, benannter Zähler, den die UI anzeigen soll. */
export interface CounterDefinition {
  key: string;
  label: string;
}

export interface SimulationModeDefinition {
  id: string;
  label: string;
  description: string;
  /** Zeigt eine Konfigurationsmaske mit diesen Zahlenfeldern, falls gesetzt. */
  configFields?: ScenarioFieldDefinition[];
  /** Zeigt ein Zähler-Panel mit diesen Kennzahlen, falls gesetzt. */
  counterDefinitions?: CounterDefinition[];
  build: (config: Record<string, number>) => SimulationModule[];
}

/** Registry der verfügbaren Baukasten-Modi. Weitere Modi werden hier ergänzt. */
export const availableModes: SimulationModeDefinition[] = [
  {
    id: 'standard',
    label: 'Standardbetrieb',
    description: 'Grundkreislauf: Ankunft -> Rampe -> Laden/Entladen -> Rückladung -> Abfahrt.',
    build: () => createStandardMode(),
  },
  {
    id: 'scenario1',
    label: 'Szenario 1: Brückenzähler',
    description: 'Feste Stückzahl je Brückenart, Physisch-/System-Zählung nach festen Regeln je Verkehrstyp.',
    configFields: [
      { key: 'sgut', label: 'Sgut-Brücken', defaultValue: SCENARIO1_DEFAULTS.sgut, min: 0, max: 30 },
      { key: 'nv', label: 'NV-Brücken', defaultValue: SCENARIO1_DEFAULTS.nv, min: 0, max: 30 },
      { key: 'leerEin', label: 'Leere Brücke Eingang', defaultValue: SCENARIO1_DEFAULTS.leerEin, min: 0, max: 30 },
      { key: 'leerAus', label: 'Leere Brücke Ausgang', defaultValue: SCENARIO1_DEFAULTS.leerAus, min: 0, max: 30 },
    ],
    counterDefinitions: [
      { key: 'physical', label: 'Physisch' },
      { key: 'system', label: 'System' },
    ],
    build: (config) =>
      createScenario1Mode({
        sgut: config.sgut ?? SCENARIO1_DEFAULTS.sgut,
        nv: config.nv ?? SCENARIO1_DEFAULTS.nv,
        leerEin: config.leerEin ?? SCENARIO1_DEFAULTS.leerEin,
        leerAus: config.leerAus ?? SCENARIO1_DEFAULTS.leerAus,
      }),
  },
];

function defaultConfigFor(modeId: string): Record<string, number> {
  const fields = availableModes.find((m) => m.id === modeId)?.configFields ?? [];
  return Object.fromEntries(fields.map((f) => [f.key, f.defaultValue]));
}

const TICKS_PER_SECOND_AT_SPEED_1 = 1;
const INITIAL_MODE_ID = 'standard';
/** Kappt große Zeitsprünge (z.B. Tab im Hintergrund) statt Ticks aufzuholen. */
const MAX_FRAME_DELTA_MS = 250;

interface SimulationStoreState {
  engine: SimulationEngine;
  snapshot: SimulationState;
  modeId: string;
  /** Aktuelle Werte der Konfigurationsmaske des aktiven Modus. */
  scenarioConfig: Record<string, number>;
  running: boolean;
  /** Geschwindigkeitsfaktor der Wiedergabe (1 = 1 Tick/s). */
  speed: number;
  /**
   * Wie weit der nächste, noch nicht angewandte Tick bereits "virtuell"
   * vergangen ist (0..1) - treibt die framegenaue Zwischeninterpolation der
   * Fahrzeugbewegung an, siehe visualization/TruckLayer.tsx.
   */
  subTickProgress: number;
  /** Aufgelaufene reale Millisekunden seit dem letzten angewandten Tick. */
  tickAccumulatorMs: number;
  animationFrameHandle: number | null;
  lastFrameTime: number | null;

  step: () => void;
  play: () => void;
  pause: () => void;
  setSpeed: (speed: number) => void;
  reset: () => void;
  setMode: (modeId: string) => void;
  setConfigValue: (key: string, value: number) => void;
}

function snapshotOf(engine: SimulationEngine): SimulationState {
  return structuredClone(engine.state);
}

export const useSimulationStore = create<SimulationStoreState>((set, get) => {
  const initialConfig = defaultConfigFor(INITIAL_MODE_ID);
  const initialModeDef = availableModes.find((m) => m.id === INITIAL_MODE_ID)!;
  const engine = new SimulationEngine({ layout: yardLayout, modules: initialModeDef.build(initialConfig) });

  const runFrame = (now: number) => {
    const s = get();
    if (!s.running) return;

    const last = s.lastFrameTime ?? now;
    const deltaMs = Math.min(now - last, MAX_FRAME_DELTA_MS);
    const msPerTick = 1000 / (TICKS_PER_SECOND_AT_SPEED_1 * s.speed);

    let accMs = s.tickAccumulatorMs + deltaMs;
    let ticked = false;
    while (accMs >= msPerTick) {
      s.engine.tick();
      accMs -= msPerTick;
      ticked = true;
    }

    set({
      lastFrameTime: now,
      tickAccumulatorMs: accMs,
      subTickProgress: accMs / msPerTick,
      ...(ticked ? { snapshot: snapshotOf(s.engine) } : {}),
    });
    set({ animationFrameHandle: requestAnimationFrame(runFrame) });
  };

  return {
    engine,
    snapshot: snapshotOf(engine),
    modeId: INITIAL_MODE_ID,
    scenarioConfig: initialConfig,
    running: false,
    speed: 1,
    subTickProgress: 0,
    tickAccumulatorMs: 0,
    animationFrameHandle: null,
    lastFrameTime: null,

    step: () => {
      get().pause();
      get().engine.tick();
      set({ snapshot: snapshotOf(get().engine), tickAccumulatorMs: 0, subTickProgress: 0 });
    },

    play: () => {
      if (get().animationFrameHandle !== null) return;
      set({ running: true, lastFrameTime: null });
      set({ animationFrameHandle: requestAnimationFrame(runFrame) });
    },

    pause: () => {
      const handle = get().animationFrameHandle;
      if (handle !== null) cancelAnimationFrame(handle);
      set({ running: false, animationFrameHandle: null, lastFrameTime: null });
    },

    setSpeed: (speed) => set({ speed }),

    reset: () => {
      get().pause();
      const modeDef = availableModes.find((m) => m.id === get().modeId) ?? availableModes[0];
      get().engine.setModules(modeDef.build(get().scenarioConfig));
      get().engine.reset();
      set({ snapshot: snapshotOf(get().engine), tickAccumulatorMs: 0, subTickProgress: 0 });
    },

    setMode: (modeId) => {
      const modeDef = availableModes.find((m) => m.id === modeId);
      if (!modeDef) return;
      get().pause();
      const config = defaultConfigFor(modeId);
      get().engine.setModules(modeDef.build(config));
      get().engine.reset();
      set({ modeId, scenarioConfig: config, snapshot: snapshotOf(get().engine), tickAccumulatorMs: 0, subTickProgress: 0 });
    },

    setConfigValue: (key, value) => {
      set((s) => ({ scenarioConfig: { ...s.scenarioConfig, [key]: value } }));
    },
  };
});
