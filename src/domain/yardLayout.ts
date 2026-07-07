import type { Slot, SlotOccupantType, Zone, ZoneKind, YardLayout } from './types';

/**
 * Yard-Layout, abgeleitet aus dem bereitgestellten Lageplan.
 *
 * WICHTIG: Die Slot-IDs sind aus dem Plan übernommene *Nummernbereiche*
 * (z.B. "251 bis 226" für LEWB), nicht jede einzelne Zahl wurde manuell
 * gegengeprüft. Insbesondere die PP-Zone (Pkw, schräge Stellplätze) war im
 * Plan nur teilweise lesbar und wurde mit Platzhalter-IDs generiert.
 * Bitte Nummern/Zonengrenzen bei Bedarf in dieser Datei korrigieren -
 * sie ist die einzige Quelle für den Yard-Aufbau (Baukasten-Prinzip:
 * Simulation und Visualisierung lesen ausschließlich aus `yardLayout`).
 *
 * Viele Slots im Plan tragen zwei Beschriftungen (eine an jedem Ende des
 * Rechtecks, exakt um 100 versetzt, z.B. 251 oben / 151 unten). Wir bilden
 * das als ein Slot mit `id` + `altId` ab, statt daraus zwei Slots zu machen -
 * das lässt sich in dieser Datei leicht ändern, falls es sich tatsächlich um
 * zwei getrennte Rückwärts-Stellplätze handelt.
 */

const defaultAccepts: Record<ZoneKind, SlotOccupantType[]> = {
  'swap-body-empty': ['wechselbruecke'],
  'trailer-generic': ['wechselbruecke', 'sattelauflieger'],
  'shunting-buffer': ['wechselbruecke', 'sattelauflieger', 'truck-only'],
  dock: ['wechselbruecke', 'sattelauflieger', 'truck-only'],
  workshop: ['wechselbruecke', 'sattelauflieger'],
  'shunting-service': ['truck-only'],
  'defect-swap-body': ['wechselbruecke'],
  'trailer-parking': ['sattelauflieger'],
  'car-park': [],
};

export const zones: Zone[] = [
  { id: 'lewb', label: 'LEWB', description: 'Leerwechselbrücken-Stellfläche', kind: 'swap-body-empty' },
  { id: 'ang', label: 'ANG', description: 'Anhänger-/Wechselbrücken-Stellfläche', kind: 'trailer-generic' },
  { id: 'umw', label: 'UMW', description: 'Umsetz-/Pufferfläche West', kind: 'shunting-buffer' },
  { id: 'umo', label: 'UMO', description: 'Umsetz-/Pufferfläche Ost', kind: 'shunting-buffer' },
  { id: 'dock', label: 'Laderampen', description: 'Nummerierte Ladetore der Halle', kind: 'dock' },
  { id: 'wkst', label: 'WKST', description: 'Werkstatt', kind: 'workshop' },
  { id: 'pprd', label: 'PPRD', description: 'Rang.D. – Rangierdienst', kind: 'shunting-service' },
  { id: 'def', label: 'DEF', description: 'Def. WB – defekte Wechselbrücken', kind: 'defect-swap-body' },
  { id: 'sa', label: 'SA', description: 'Abstellfläche Sattel', kind: 'trailer-parking' },
  { id: 'pp', label: 'PP', description: 'Pkw-Parkplätze (kein LKW-Verkehr)', kind: 'car-park' },
];

const zoneById = new Map(zones.map((z) => [z.id, z]));

function accepts(zoneId: string): SlotOccupantType[] {
  const zone = zoneById.get(zoneId);
  if (!zone) throw new Error(`Unknown zone ${zoneId}`);
  return defaultAccepts[zone.kind];
}

/** Erzeugt eine Reihe von Slots mit absteigenden/aufsteigenden fortlaufenden IDs. */
function generateRow(opts: {
  zoneId: string;
  startId: number;
  endId: number; // inklusive, kann kleiner als startId sein (absteigend)
  altOffset?: number; // z.B. -100 für die zweite Beschriftung
  x0: number;
  y: number;
  width: number;
  height: number;
  gap: number;
  rotation?: number;
}): Slot[] {
  const { zoneId, startId, endId, altOffset, x0, y, width, height, gap, rotation } = opts;
  const step = startId <= endId ? 1 : -1;
  const count = Math.abs(endId - startId) + 1;
  const slots: Slot[] = [];
  for (let i = 0; i < count; i++) {
    const id = startId + i * step;
    slots.push({
      id: String(id),
      altId: altOffset !== undefined ? String(id + altOffset) : undefined,
      zoneId,
      x: x0 + i * (width + gap),
      y,
      width,
      height,
      rotation,
      accepts: accepts(zoneId),
      capacity: 1,
    });
  }
  return slots;
}

function generateColumn(opts: {
  zoneId: string;
  ids: number[];
  x: number;
  y0: number;
  width: number;
  height: number;
  gap: number;
}): Slot[] {
  const { zoneId, ids, x, y0, width, height, gap } = opts;
  return ids.map((id, i) => ({
    id: String(id),
    zoneId,
    x,
    y: y0 + i * (height + gap),
    width,
    height,
    accepts: accepts(zoneId),
    capacity: 1,
  }));
}

const slots: Slot[] = [
  // --- Nordblock: LEWB (251-226 / 151-126) + ANG (225-201 / 125-101) ---
  ...generateRow({ zoneId: 'lewb', startId: 251, endId: 226, altOffset: -100, x0: 60, y: 60, width: 18, height: 90, gap: 2 }),
  ...generateRow({ zoneId: 'ang', startId: 225, endId: 201, altOffset: -100, x0: 60 + 26 * 20 + 12, y: 60, width: 18, height: 90, gap: 2 }),

  // --- Halle: Laderampen Nordseite (095-054) und Südseite (001-041) ---
  ...generateRow({ zoneId: 'dock', startId: 95, endId: 54, x0: 120, y: 260, width: 16, height: 70, gap: 2 }),
  ...generateRow({ zoneId: 'dock', startId: 1, endId: 41, x0: 120, y: 660, width: 16, height: 70, gap: 2 }),
  // Laderampen Ostseite der Halle (053-042), vertikal
  ...generateColumn({ zoneId: 'dock', ids: [53, 52, 51, 50, 49, 48, 47, 46, 45, 44, 43, 42], x: 1010, y0: 375, width: 70, height: 16, gap: 2 }),

  // --- Umsetz-/Pufferflächen West (UMW) und Ost (UMO) ---
  ...generateColumn({ zoneId: 'umw', ids: [301, 302, 303, 304], x: 15, y0: 360, width: 30, height: 80, gap: 6 }),
  ...generateColumn({ zoneId: 'umo', ids: [305, 306, 307, 308], x: 1150, y0: 175, width: 30, height: 80, gap: 6 }),

  // --- Werkstatt (WKST) ---
  ...generateColumn({ zoneId: 'wkst', ids: [998, 995, 999, 996, 997], x: 1010, y0: 660, width: 90, height: 15, gap: 3 }),

  // --- Südblock: PPRD (Rang.D.), DEF (Def. WB), SA (Abstellfläche Sattel) ---
  ...generateRow({ zoneId: 'pprd', startId: 152, endId: 155, altOffset: 100, x0: 40, y: 845, width: 18, height: 45, gap: 2 }),
  ...generateRow({ zoneId: 'def', startId: 156, endId: 160, altOffset: 100, x0: 40 + 4 * 20 + 10, y: 845, width: 18, height: 45, gap: 2 }),
  ...generateRow({ zoneId: 'sa', startId: 161, endId: 175, altOffset: 100, x0: 40 + 4 * 20 + 10 + 5 * 20 + 10, y: 845, width: 18, height: 45, gap: 2 }),

  // --- PP: Pkw-Parkplätze, schräg (Nummern im Plan nicht vollständig lesbar) ---
  ...Array.from({ length: 8 }, (_, i) => ({
    id: `PP-${String(i + 1).padStart(2, '0')}`,
    zoneId: 'pp',
    x: 950 + i * 30,
    y: 1000,
    width: 26,
    height: 70,
    rotation: 35,
    accepts: accepts('pp'),
    capacity: 1,
  })),
];

export const yardLayout: YardLayout = {
  zones,
  slots,
  bounds: { width: 1220, height: 1130 },
};

export const slotById = new Map(slots.map((s) => [s.id, s]));

export function getZone(zoneId: string): Zone {
  const zone = zoneById.get(zoneId);
  if (!zone) throw new Error(`Unknown zone ${zoneId}`);
  return zone;
}

export function slotsByZone(zoneId: string): Slot[] {
  return yardLayout.slots.filter((s) => s.zoneId === zoneId);
}
