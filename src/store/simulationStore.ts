import { create } from 'zustand';
import { yardLayout } from '../domain/yardLayout';
import { SimulationEngine } from '../simulation/engine';
import { createStandardMode } from '../simulation/modes/standardMode';
import { createScenario1Mode, SCENARIO1_DEFAULTS } from '../simulation/modes/scenario1';
import { createScenario2Mode, SCENARIO2_DEFAULTS } from '../simulation/modes/scenario2';
import type { SimulationState } from '../simulation/state';
import type { SimulationModule } from '../simulation/modules/types';

/**
 * Ein einzelnes Eingabefeld einer Modus-Konfigurationsmaske. Ohne `options`
 * ein Zahlenfeld; mit `options` ein Auswahlfeld (Werte sind trotzdem
 * numerisch kodiert, damit `scenarioConfig` einheitlich `Record<string,
 * number>` bleibt - z.B. Zufallsmodus=0 / Manuell=1).
 */
export interface ScenarioFieldDefinition {
  key: string;
  label: string;
  defaultValue: number;
  min?: number;
  max?: number;
  options?: { value: number; label: string }[];
  /** Feld wird deaktiviert (grau, ohne Wirkung), solange diese Funktion true liefert. */
  disabledWhen?: (config: Record<string, number>) => boolean;
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
  /** Zeigt eine große Uhrzeit-/24h-Fortschrittsanzeige (für uhrzeitgebundene Modi). */
  showClock?: boolean;
  /** Zeigt das Auswertungs-Panel (Eingänge/Ausgänge je Verkehrsart, Zeiten). */
  showEvaluation?: boolean;
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
  {
    id: 'scenario2',
    label: 'Szenario 2: 24-Stunden-Betrieb',
    description: 'Ein simulierter Tag mit sechs uhrzeitgebundenen Verkehrsarten (Sammelgut/Nahverkehr, Leerbrücken) und Hofbestand.',
    configFields: [
      {
        key: 'mode',
        label: 'Erzeugungsart',
        defaultValue: SCENARIO2_DEFAULTS.mode,
        options: [
          { value: 0, label: 'Zufallsmodus (Stückzahl automatisch)' },
          { value: 1, label: 'Manuell (Stückzahl unten festlegen)' },
        ],
      },
      { key: 'hofbestand', label: 'Hofbestand (LEWB-Startbestand)', defaultValue: SCENARIO2_DEFAULTS.hofbestand, min: 0, max: 26 },
      { key: 'sge', label: 'Sammelgut Eingang (23-05 Uhr)', defaultValue: SCENARIO2_DEFAULTS.sge, min: 0, max: 40, disabledWhen: (c) => c.mode === 0 },
      { key: 'sga', label: 'Sammelgut Ausgang (18-23 Uhr)', defaultValue: SCENARIO2_DEFAULTS.sga, min: 0, max: 40, disabledWhen: (c) => c.mode === 0 },
      { key: 'nva', label: 'Nahverkehr Ausgang (06-08 Uhr)', defaultValue: SCENARIO2_DEFAULTS.nva, min: 0, max: 40, disabledWhen: (c) => c.mode === 0 },
      { key: 'nve', label: 'Nahverkehr Eingang (11-18 Uhr)', defaultValue: SCENARIO2_DEFAULTS.nve, min: 0, max: 40, disabledWhen: (c) => c.mode === 0 },
      { key: 'le', label: 'Leerbrücke Eingang', defaultValue: SCENARIO2_DEFAULTS.le, min: 0, max: 40, disabledWhen: (c) => c.mode === 0 },
      { key: 'la', label: 'Leerbrücke Ausgang', defaultValue: SCENARIO2_DEFAULTS.la, min: 0, max: 40, disabledWhen: (c) => c.mode === 0 },
    ],
    counterDefinitions: [
      { key: 'physical', label: 'Physisch' },
      { key: 'system', label: 'System' },
    ],
    showClock: true,
    showEvaluation: true,
    build: (config) =>
      createScenario2Mode({
        mode: config.mode ?? SCENARIO2_DEFAULTS.mode,
        hofbestand: config.hofbestand ?? SCENARIO2_DEFAULTS.hofbestand,
        sge: config.sge ?? SCENARIO2_DEFAULTS.sge,
        sga: config.sga ?? SCENARIO2_DEFAULTS.sga,
        nva: config.nva ?? SCENARIO2_DEFAULTS.nva,
        nve: config.nve ?? SCENARIO2_DEFAULTS.nve,
        le: config.le ?? SCENARIO2_DEFAULTS.le,
        la: config.la ?? SCENARIO2_DEFAULTS.la,
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
