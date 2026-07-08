import type { Truck } from '../domain/types';
import { slotById } from '../domain/yardLayout';
import type { SimulationState } from '../simulation/state';
import { GATE_EXIT } from '../simulation/state';
import { buildRouteFromSlot, buildRouteToSlot, easeInOutCubic, GATE, pointAtProgress, preparePath, type RoutePosition } from '../domain/roadNetwork';

/**
 * Ermittelt Bildschirmposition + Blickrichtung eines LKW.
 *
 * `subTickProgress` (0..1) und `minutesPerTick` erlauben eine flüssige
 * Zwischeninterpolation über mehrere Animationsframes hinweg, auch wenn die
 * Simulation selbst nur alle paar hundert Millisekunden einen Tick ausführt
 * (siehe store/simulationStore.ts) - der LKW fährt dadurch die Strecke
 * durchgehend ab, statt zwischen Tick-Positionen zu springen.
 */
export function getTruckMarkerPosition(
  truck: Truck,
  movements: SimulationState['movements'],
  subTickProgress: number,
  minutesPerTick: number,
): RoutePosition {
  if (truck.status === 'at-dock' && truck.currentSlotId) {
    const slot = slotById.get(truck.currentSlotId);
    if (slot) return { point: { x: slot.x + slot.width / 2, y: slot.y + slot.height / 2 }, heading: 0 };
  }

  if (truck.status === 'moving') {
    const movement = movements[truck.id];
    let linearProgress = 0;
    if (movement && movement.total > 0) {
      const effectiveRemaining = Math.max(0, movement.remaining - minutesPerTick * subTickProgress);
      linearProgress = 1 - effectiveRemaining / movement.total;
    }
    const progress = easeInOutCubic(linearProgress);

    if (truck.targetSlotId && truck.targetSlotId !== GATE_EXIT) {
      const slot = slotById.get(truck.targetSlotId);
      if (slot) return pointAtProgress(preparePath(buildRouteToSlot(slot)), progress);
    } else if (truck.currentSlotId) {
      const slot = slotById.get(truck.currentSlotId);
      if (slot) return pointAtProgress(preparePath(buildRouteFromSlot(slot)), progress);
    }
  }

  // Wartet am Gate (frisch angekommen, noch keine Rampe zugewiesen).
  return { point: GATE, heading: 0 };
}
