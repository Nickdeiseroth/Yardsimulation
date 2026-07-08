import { createMovementModule } from '../../modules/movement';
import { createShuntingModule } from '../../modules/shunting';
import { createCleanupModule } from '../../modules/cleanup';
import type { SimulationModule } from '../../modules/types';
import { createScenario2SetupModule } from './setup';
import { createScenario2ArrivalModule } from './scheduledArrival';
import { createScenario2AssignmentModule } from './assignment';
import { createScenario2DwellDepartureModule } from './dwellDeparture';
import { createScenario2DepartureCounterModule } from './departureCounter';
import type { Scenario2Config } from './types';

/**
 * Szenario 2: 24-Stunden-Betrieb mit sechs uhrzeitgebundenen Verkehrsarten
 * (siehe types.ts für Zeitfenster/Regeln je Art). Nutzt die generischen
 * Bausteine Movement/Shunting/Cleanup unverändert weiter - Ankunft, Zuweisung,
 * Verweildauer/Abfahrt sind szenariospezifisch, weil hier mehrstufige Fahrten
 * (Gate -> LEWB -> Tor -> Gate) und uhrzeitgebundenes statt getaktetes
 * Verskripten nötig sind.
 */
export function createScenario2Mode(config: Scenario2Config): SimulationModule[] {
  return [
    createScenario2SetupModule(config),
    createScenario2ArrivalModule(),
    createScenario2AssignmentModule(),
    createMovementModule(),
    createScenario2DepartureCounterModule(),
    createScenario2DwellDepartureModule(),
    createShuntingModule(),
    createCleanupModule(),
  ];
}

export * from './types';
