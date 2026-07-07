import { createMovementModule } from '../../modules/movement';
import { createShuntingModule } from '../../modules/shunting';
import { createCleanupModule } from '../../modules/cleanup';
import type { SimulationModule } from '../../modules/types';
import { createScenario1SetupModule } from './setup';
import { createScriptedArrivalModule } from './scriptedArrival';
import { createScenario1AssignmentModule } from './assignment';
import { createScenario1DwellDepartureModule } from './dwellDeparture';
import { createScenario1DepartureCounterModule } from './departureCounter';
import type { Scenario1Config } from './types';

/**
 * Szenario 1: feste Stückzahlen je Brückenart mit Physisch-/System-Zählung
 * (siehe types.ts für die genauen Regeln je Verkehrstyp). Nutzt die
 * generischen Bausteine Movement/Shunting/Cleanup aus dem Standardmodus
 * unverändert weiter - nur Ankunft, Zuweisung und Verweildauer/Abfahrt sind
 * szenariospezifisch, weil hier (anders als im Standardbetrieb) je nach
 * Verkehrstyp unterschiedliche Ziel-Zonen und Zählregeln gelten.
 */
export function createScenario1Mode(config: Scenario1Config): SimulationModule[] {
  return [
    createScenario1SetupModule(config),
    createScriptedArrivalModule(),
    createScenario1AssignmentModule(),
    createMovementModule(),
    createScenario1DepartureCounterModule(),
    createScenario1DwellDepartureModule(),
    createShuntingModule(),
    createCleanupModule(),
  ];
}

export * from './types';
