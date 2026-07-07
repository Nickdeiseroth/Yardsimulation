import type { CargoUnit, Truck } from '../domain/types';

export interface SlotOccupant {
  truckId?: string;
  cargoId?: string;
}

export interface SimulationEvent {
  time: number;
  message: string;
}

/** Gesamter veränderlicher Zustand einer Simulation zu einem Zeitpunkt. */
export interface SimulationState {
  /** Simulationszeit in Minuten seit Start. */
  time: number;
  trucks: Record<string, Truck>;
  cargoUnits: Record<string, CargoUnit>;
  /** slotId -> aktueller Belegungseintrag. Kein Eintrag = frei. */
  slotOccupancy: Record<string, SlotOccupant>;
  /** LKW, die am Gate auf Einweisung warten. */
  gateQueue: string[];
  /** truckId -> verbleibende Minuten bis Ankunft am Ziel-Slot bzw. Gate. */
  movements: Record<string, number>;
  /** truckId -> verbleibende Minuten Lade-/Entladezeit an der Rampe. */
  dwellTimers: Record<string, number>;
  events: SimulationEvent[];
  nextTruckSeq: number;
  nextCargoSeq: number;
}

export function createInitialState(): SimulationState {
  return {
    time: 0,
    trucks: {},
    cargoUnits: {},
    slotOccupancy: {},
    gateQueue: [],
    movements: {},
    dwellTimers: {},
    events: [],
    nextTruckSeq: 1,
    nextCargoSeq: 1,
  };
}

export const GATE_EXIT = 'GATE_EXIT';

export const MAX_EVENT_LOG = 200;
