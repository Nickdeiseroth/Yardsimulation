import type { Slot } from '../domain/types';

export interface Point {
  x: number;
  y: number;
}

/**
 * Vereinfachtes Straßennetz: eine rechteckige Ringstraße um die Halle (West-,
 * Nord-, Ost-, Südkante, jeweils in der Gasse zwischen den Stellplatzblöcken),
 * plus ein Gate-Stichweg, der von der Südkante gerade nach unten in die freie
 * Fläche zwischen "Abstellfläche Sattel" und "PP" führt. Jede Zone bindet über
 * einen kurzen Stich an die nächstliegende Kante an (siehe `edgeAndPointFor`).
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

/** Anschlusspunkt des Gate-Stichs auf der Südkante (liegt zwischen SW und SE). */
const GATE_JUNCTION: Point = { x: 745, y: SOUTH_Y };
export const GATE: Point = { x: 745, y: 1080 };
const GATE_STUB: Point[] = [GATE, GATE_JUNCTION];

/**
 * Eckpunkte im Uhrzeigersinn, beginnend am Gate-Anschlusspunkt: von dort erst
 * zur SW-Ecke (kürzeres Reststück der Südkante), dann rundherum bis zurück
 * zur SE-Ecke (das andere Reststück der Südkante schließt den Ring wieder am
 * Gate-Anschlusspunkt).
 */
const corners: Point[] = [GATE_JUNCTION, SW, NW, NE, SE];
const edgeCount = corners.length;
const edgeLengths = corners.map((c, i) => dist(c, corners[(i + 1) % edgeCount]));
const cumulative = edgeLengths.reduce<number[]>((acc, len, i) => [...acc, (acc[i] ?? 0) + len], [0]).slice(0, edgeCount);
const totalPerimeter = edgeLengths.reduce((a, b) => a + b, 0);

/** Statische Streckenführung, für die Hintergrund-Darstellung der Straßen. */
export const roadNetworkPolyline: Point[] = [...GATE_STUB, ...corners.slice(1), GATE_JUNCTION];

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
      return { edgeIndex: 2, point: { x: clamp(cx, NW.x, NE.x), y: NORTH_Y } };
    case 'dock':
      if (slot.x > 950) return { edgeIndex: 3, point: { x: EAST_X, y: clamp(cy, NE.y, SE.y) } };
      if (slot.y < 450) return { edgeIndex: 2, point: { x: clamp(cx, NW.x, NE.x), y: NORTH_Y } };
      return southEdgePoint(cx);
    case 'umw':
      return { edgeIndex: 1, point: { x: WEST_X, y: clamp(cy, NW.y, SW.y) } };
    case 'umo':
    case 'wkst':
      return { edgeIndex: 3, point: { x: EAST_X, y: clamp(cy, NE.y, SE.y) } };
    default:
      // pprd, def, sa, pp und alles Weitere: Anbindung über die Südkante.
      return southEdgePoint(cx);
  }
}

/** Südkante ist am Gate-Anschlusspunkt in zwei Teilstücke gesplittet (edge0: Richtung SW, edge4: Richtung SE). */
function southEdgePoint(cx: number): { edgeIndex: number; point: Point } {
  const x = clamp(cx, SW.x, SE.x);
  return x <= GATE_JUNCTION.x ? { edgeIndex: 0, point: { x, y: SOUTH_Y } } : { edgeIndex: edgeCount - 1, point: { x, y: SOUTH_Y } };
}

function buildLoopPath(edgeIndex: number, point: Point): Point[] {
  const clockwiseDist = cumulative[edgeIndex] + dist(corners[edgeIndex], point);
  const counterClockwiseDist = totalPerimeter - clockwiseDist;

  if (clockwiseDist <= counterClockwiseDist) {
    return [...corners.slice(0, edgeIndex + 1), point];
  }
  const pts = [corners[0]];
  for (let k = edgeCount - 1; k >= edgeIndex + 1; k--) pts.push(corners[k]);
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

const LANE_OFFSET = 3.2;
const CORNER_RADIUS = 16;

function normalize(v: Point): Point {
  const len = Math.hypot(v.x, v.y) || 1;
  return { x: v.x / len, y: v.y / len };
}

/** 90°-Rotation eines Richtungsvektors - "rechts der Fahrtrichtung". */
function rightOf(dir: Point): Point {
  return { x: -dir.y, y: dir.x };
}

function lerpTowards(from: Point, to: Point, distance: number): Point {
  const t = distance / (dist(from, to) || 1);
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

function quadraticBezier(p0: Point, p1: Point, p2: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

/**
 * Verschiebt eine Route seitlich um `distance` nach rechts der jeweiligen
 * lokalen Fahrtrichtung - simuliert eine eigene Fahrspur, damit Hin- und
 * Rückfahrt (bzw. mehrere gleichzeitige LKW auf derselben Strecke) nicht
 * exakt deckungsgleich übereinanderliegen.
 */
export function offsetRoute(points: Point[], distance: number): Point[] {
  if (points.length < 2 || distance === 0) return points;
  return points.map((p, i) => {
    const a = points[Math.max(0, i - 1)];
    const b = points[Math.min(points.length - 1, i + 1)];
    const perp = rightOf(normalize({ x: b.x - a.x, y: b.y - a.y }));
    return { x: p.x + perp.x * distance, y: p.y + perp.y * distance };
  });
}

/**
 * Ersetzt scharfe Knicke einer Route durch kleine, abgetastete Kurven
 * (quadratische Bézier), damit LKW nicht auf der Stelle abbiegen, sondern
 * die Ecke "ausfahren" - realistischer als der reine Streckenzug.
 */
export function roundedRoute(points: Point[], radius = CORNER_RADIUS, segments = 6): Point[] {
  if (points.length < 3) return points;
  const result: Point[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const prev = result[result.length - 1];
    const curr = points[i];
    const next = points[i + 1];
    const r = Math.min(radius, dist(curr, prev) / 2, dist(curr, next) / 2);
    if (r < 0.5) {
      result.push(curr);
      continue;
    }
    const entry = lerpTowards(curr, prev, r);
    const exit = lerpTowards(curr, next, r);
    result.push(entry);
    for (let s = 1; s <= segments; s++) {
      result.push(quadraticBezier(entry, curr, exit, s / (segments + 1)));
    }
    result.push(exit);
  }
  result.push(points[points.length - 1]);
  return result;
}

/** Kombiniert Fahrspur-Versatz + Kurvenglättung - der finale "Look" einer gefahrenen Strecke. */
export function preparePath(route: Point[]): Point[] {
  return roundedRoute(offsetRoute(route, LANE_OFFSET), CORNER_RADIUS);
}

/** Sanftes Anfahren/Abbremsen statt konstanter Geschwindigkeit. */
export function easeInOutCubic(t: number): number {
  const c = clamp(t, 0, 1);
  return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2;
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
