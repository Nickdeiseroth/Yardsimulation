import { useSimulationStore } from '../store/simulationStore';
import { TruckMarker } from './TruckMarker';
import { getTruckMarkerPosition } from './truckPosition';

/**
 * Eigene Komponente für die LKW-Symbole, damit die framegenaue
 * Zwischeninterpolation (`subTickProgress`, siehe store/simulationStore.ts)
 * nur diesen kleinen Teilbaum jeden Animationsframe neu rendert - nicht die
 * gesamte Karte mit ~300 Stellplätzen, die sich ohnehin nur bei echten
 * Simulations-Ticks ändern.
 */
export function TruckLayer() {
  const trucks = useSimulationStore((s) => s.snapshot.trucks);
  const movements = useSimulationStore((s) => s.snapshot.movements);
  const subTickProgress = useSimulationStore((s) => s.subTickProgress);
  const minutesPerTick = useSimulationStore((s) => s.engine.minutesPerTick);

  const activeTrucks = Object.values(trucks).filter((t) => t.status !== 'departed');

  return (
    <>
      {activeTrucks.map((truck) => {
        const { point, heading } = getTruckMarkerPosition(truck, movements, subTickProgress, minutesPerTick);
        return (
          <TruckMarker
            key={truck.id}
            x={point.x}
            y={point.y}
            heading={heading}
            cargoType={truck.cargo?.type}
            moving={truck.status === 'moving'}
            label={`${truck.id} (${truck.licensePlate})${truck.cargo ? ` – ${truck.cargo.type} ${truck.cargo.id}` : ' – solo'}`}
          />
        );
      })}
    </>
  );
}
