import type { YardLayout } from '../../domain/types';
import type { SimulationState } from '../state';

export interface TickContext {
  state: SimulationState;
  layout: YardLayout;
  /** Minuten, die dieser Tick simuliert. */
  dt: number;
  rng: () => number;
  log: (message: string) => void;
}

/**
 * Ein einzelner Baustein des "Baukastens". Ein Simulationsmodus ist nichts
 * weiter als eine geordnete Liste von SimulationModules, die pro Tick der
 * Reihe nach auf den gemeinsamen State schreiben (Arrival -> Assignment ->
 * Movement -> Dwell/Departure -> Shunting -> Cleanup, siehe modes/standardMode.ts).
 *
 * Neue Modi entstehen, indem man Module austauscht oder ergänzt, ohne die
 * Engine oder Visualisierung anzufassen - z.B. ein "PeakSeasonArrivalModule"
 * mit höherer Ankunftsrate, oder ein "BreakdownModule", das Ladeeinheiten
 * zufällig als defekt markiert und in die DEF-Zone schickt.
 */
export interface SimulationModule {
  id: string;
  label: string;
  description: string;
  /**
   * Optionale einmalige Initialisierung, wenn der Modus geladen/zurückgesetzt
   * wird - z.B. um Startbestand zu platzieren oder eine Ankunfts-Warteliste
   * aufzubauen (siehe modes/scenario1/setup.ts). Läuft vor dem ersten Tick.
   */
  onInit?(ctx: TickContext): void;
  onTick(ctx: TickContext): void;
}
