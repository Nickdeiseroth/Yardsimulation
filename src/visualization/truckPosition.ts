import type { Truck } from '../domain/types';
import { slotById } from '../domain/yardLayout';
import { GATE_EXIT, type SimulationState } from '../simulation/state';
import { buildRouteToSlot, GATE, pointAtProgress, type RoutePosition } from './roadNetwork';

/** Ermittelt Bildschirmposition + Blickrichtung eines LKW für den aktuellen Snapshot. */
export function getTruckMarkerPosition(truck: Truck, state: SimulationState): RoutePosition {
  if (truck.status === 'at-dock' && truck.currentSlotId) {
    const slot = slotById.get(truck.currentSlotId);
    if (slot) return { point: { x: slot.x + slot.width / 2, y: slot.y + slot.height / 2 }, heading: 0 };
  }

  if (truck.status === 'moving') {
    const movement = state.movements[truck.id];
    const progress = movement && movement.total > 0 ? 1 - movement.remaining / movement.total : 0;

    if (truck.targetSlotId && truck.targetSlotId !== GATE_EXIT) {
      const slot = slotById.get(truck.targetSlotId);
      if (slot) return pointAtProgress(buildRouteToSlot(slot), progress);
    } else if (truck.currentSlotId) {
      const slot = slotById.get(truck.currentSlotId);
      if (slot) return pointAtProgress([...buildRouteToSlot(slot)].reverse(), progress);
    }
  }

  // Wartet am Gate (frisch angekommen, noch keine Rampe zugewiesen).
  return { point: GATE, heading: 0 };
}
