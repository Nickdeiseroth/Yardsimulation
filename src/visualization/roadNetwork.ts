import type { Slot } from '../domain/types';

export interface Point {
  x: number;
  y: number;
}

/**
 * Vereinfachtes Straßennetz: eine rechteckige Ringstraße um die Halle (West-,
 * Nord-, Ost-, Südkante, jeweils in der Gasse zwischen den Stellplatzblöcken),
 * plus ein Gate-Stichweg unten links. Jede Zone bindet über einen kurzen
 * Stich an die nächstliegende Kante an (siehe `edgeAndPointFor`).
 *
 * Das ist bewusst kein echtes Pathfinding, sondern eine feste, an den
 * Lageplan angelehnte Geometrie - ausreichend, um LKW-Fahrten nachvollziehbar
 * entlang von "Straßen" zu animieren statt sie geradlinig durch Gebäude
 * fahren zu lassen.
 */
const WEST_X = 75;
const EAST_X = 1125;
const NORTH_Y = 205;
const SOUTH_Y = 787;

const SW: Point = { x: WEST_X, y: SOUTH_Y };
const NW: Point = { x: WEST_X, y: NORTH_Y };
const NE: Point = { x: EAST_X, y: NORTH_Y };
const SE: Point = { x: EAST_X, y: SOUTH_Y };

/** Eckpunkte im Uhrzeigersinn, beginnend unten links (Anschlusspunkt des Gates). */
const corners: Point[] = [SW, NW, NE, SE];
const edgeLengths = corners.map((c, i) => dist(c, corners[(i + 1) % 4]));
const cumulative = [0, edgeLengths[0], edgeLengths[0] + edgeLengths[1], edgeLengths[0] + edgeLengths[1] + edgeLengths[2]];
const totalPerimeter = cumulative[3] + edgeLengths[3];

// Der Gate-Stich macht einen Knick um den PPRD/DEF/SA-Block herum, statt
// gerade durch dessen Stellplätze zu verlaufen.
export const GATE: Point = { x: 20, y: 1010 };
const GATE_STUB: Point[] = [GATE, { x: 20, y: 825 }, { x: WEST_X, y: 825 }, SW];

/** Statische Streckenführung, für die Hintergrund-Darstellung der Straßen. */
export const roadNetworkPolyline: Point[] = [...GATE_STUB.slice(0, -1), ...corners, SW];

function dist(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

function edgeAndPointFor(slot: Slot): { edgeIndex: number; point: Point } {
  const cx = slot.x + slot.width / 2;
  const cy = slot.y + slot.height / 2;

  switch (slot.zoneId) {
    case 'lewb':
    case 'ang':
      return { edgeIndex: 1, point: { x: clamp(cx, NW.x, NE.x), y: NORTH_Y } };
    case 'dock':
      if (slot.x > 950) return { edgeIndex: 2, point: { x: EAST_X, y: clamp(cy, NE.y, SE.y) } };
      if (slot.y < 450) return { edgeIndex: 1, point: { x: clamp(cx, NW.x, NE.x), y: NORTH_Y } };
      return { edgeIndex: 3, point: { x: clamp(cx, SW.x, SE.x), y: SOUTH_Y } };
    case 'umw':
      return { edgeIndex: 0, point: { x: WEST_X, y: clamp(cy, NW.y, SW.y) } };
    case 'umo':
    case 'wkst':
      return { edgeIndex: 2, point: { x: EAST_X, y: clamp(cy, NE.y, SE.y) } };
    default:
      // pprd, def, sa, pp und alles Weitere: Anbindung über die Südkante.
      return { edgeIndex: 3, point: { x: clamp(cx, SW.x, SE.x), y: SOUTH_Y } };
  }
}

function buildLoopPath(edgeIndex: number, point: Point): Point[] {
  const clockwiseDist = cumulative[edgeIndex] + dist(corners[edgeIndex], point);
  const counterClockwiseDist = totalPerimeter - clockwiseDist;

  if (clockwiseDist <= counterClockwiseDist) {
    return [...corners.slice(0, edgeIndex + 1), point];
  }
  const pts = [corners[0]];
  for (let k = 3; k >= edgeIndex + 1; k--) pts.push(corners[k]);
  pts.push(point);
  return pts;
}

/** Route vom Gate zu einem Slot (kürzerer Weg entlang der Ringstraße + Anbindungsstich). */
export function buildRouteToSlot(slot: Slot): Point[] {
  const { edgeIndex, point } = edgeAndPointFor(slot);
  const loopPath = buildLoopPath(edgeIndex, point);
  const slotCenter: Point = { x: slot.x + slot.width / 2, y: slot.y + slot.height / 2 };
  return [...GATE_STUB, ...loopPath.slice(1), slotCenter];
}

export interface RoutePosition {
  point: Point;
  /** Fahrtrichtung in Grad (0 = nach rechts/Osten), für die Rotation des LKW-Symbols. */
  heading: number;
}

/** Position + Blickrichtung eines Fahrzeugs entlang einer Route bei Fortschritt 0..1. */
export function pointAtProgress(route: Point[], progress: number): RoutePosition {
  if (route.length === 0) return { point: GATE, heading: 0 };
  if (route.length === 1) return { point: route[0], heading: 0 };

  const segmentLengths = route.slice(0, -1).map((p, i) => dist(p, route[i + 1]));
  const total = segmentLengths.reduce((a, b) => a + b, 0);
  const targetDist = clamp(progress, 0, 1) * total;

  let acc = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    const segLen = segmentLengths[i];
    const reachedEnd = i === segmentLengths.length - 1;
    if (acc + segLen >= targetDist || reachedEnd) {
      const segT = segLen > 0 ? clamp((targetDist - acc) / segLen, 0, 1) : 0;
      const a = route[i];
      const b = route[i + 1];
      return {
        point: { x: a.x + (b.x - a.x) * segT, y: a.y + (b.y - a.y) * segT },
        heading: (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI,
      };
    }
    acc += segLen;
  }
  return { point: route[route.length - 1], heading: 0 };
}
