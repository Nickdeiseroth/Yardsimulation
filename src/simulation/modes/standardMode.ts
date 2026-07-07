import { createArrivalModule, type ArrivalModuleConfig } from '../modules/arrival';
import { createAssignmentModule, type AssignmentModuleConfig } from '../modules/assignment';
import { createMovementModule } from '../modules/movement';
import { createDwellDepartureModule, type DwellDepartureModuleConfig } from '../modules/dwellDeparture';
import { createShuntingModule } from '../modules/shunting';
import { createCleanupModule } from '../modules/cleanup';
import type { SimulationModule } from '../modules/types';

export interface StandardModeConfig {
  arrival?: Partial<ArrivalModuleConfig>;
  assignment?: Partial<AssignmentModuleConfig>;
  dwellDeparture?: Partial<DwellDepartureModuleConfig>;
}

/**
 * Standardmodus: der einfachste sinnvolle Kreislauf im Yard.
 * LKW kommt beladen an -> fährt zur freien Rampe -> lädt/entlädt -> koppelt ggf.
 * eine leere Ladeeinheit aus LEWB/SA -> fährt ab. Der Rangierdienst räumt
 * abgestellte Ladeeinheiten von der Rampe in die Lagerzonen.
 *
 * Dies ist bewusst der "Baustein-Baseline"-Modus: weitere Modi entstehen, indem
 * man diese Liste kopiert und Module austauscht/ergänzt (siehe README).
 */
export function createStandardMode(config: StandardModeConfig = {}): SimulationModule[] {
  return [
    createArrivalModule(config.arrival),
    createAssignmentModule(config.assignment),
    createMovementModule(),
    createDwellDepartureModule(config.dwellDeparture),
    createShuntingModule(),
    createCleanupModule(),
  ];
}
