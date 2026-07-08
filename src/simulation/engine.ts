import type { YardLayout } from '../domain/types';
import { createRng } from './rng';
import { createInitialState, MAX_EVENT_LOG, type SimulationState } from './state';
import type { SimulationModule, TickContext } from './modules/types';

export interface EngineOptions {
  layout: YardLayout;
  modules: SimulationModule[];
  seed?: number;
  /** Simulierte Minuten pro Tick. */
  minutesPerTick?: number;
}

/**
 * Führt eine geordnete Liste von SimulationModules über einen gemeinsamen State
 * aus. Die Engine selbst kennt keine Yard-Fachlogik - die steckt komplett in den
 * Modulen des jeweiligen Modus. Das ist der Kern des Baukasten-Prinzips: neue
 * Simulationsmodi = neue Modul-Kombination, die Engine bleibt unverändert.
 */
export class SimulationEngine {
  readonly layout: YardLayout;
  private modules: SimulationModule[];
  private seed: number;
  private rng: () => number;
  private _minutesPerTick: number;
  state: SimulationState;

  constructor(options: EngineOptions) {
    this.layout = options.layout;
    this.modules = options.modules;
    this.seed = options.seed ?? 42;
    this.rng = createRng(this.seed);
    this._minutesPerTick = options.minutesPerTick ?? 5;
    this.state = createInitialState();
    this.runInit();
  }

  reset(seed?: number): void {
    this.seed = seed ?? this.seed;
    this.rng = createRng(this.seed);
    this.state = createInitialState();
    this.runInit();
  }

  setModules(modules: SimulationModule[]): void {
    this.modules = modules;
  }

  get activeModules(): SimulationModule[] {
    return this.modules;
  }

  /** Simulierte Minuten pro Tick - für Visualisierungen, die zwischen Ticks weich interpolieren wollen. */
  get minutesPerTick(): number {
    return this._minutesPerTick;
  }

  private buildContext(): TickContext {
    return {
      state: this.state,
      layout: this.layout,
      dt: this.minutesPerTick,
      rng: this.rng,
      log: (message) => {
        this.state.events.push({ time: this.state.time, message });
        if (this.state.events.length > MAX_EVENT_LOG) this.state.events.shift();
      },
    };
  }

  private runInit(): void {
    const ctx = this.buildContext();
    for (const mod of this.modules) mod.onInit?.(ctx);
  }

  tick(): void {
    const ctx = this.buildContext();
    for (const mod of this.modules) mod.onTick(ctx);
    this.state.time += this.minutesPerTick;
  }
}
