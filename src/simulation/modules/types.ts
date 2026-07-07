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
  onTick(ctx: TickContext): void;
}
