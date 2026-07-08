/**
 * Szenario 2: 24-Stunden-Betrieb mit sechs uhrzeitgebundenen Verkehrsarten.
 *
 * Alle Zeiten sind Minuten seit Mitternacht (0 = 00:00, 1440 = 24:00 des
 * nächsten Tages). Fenster, die über Mitternacht hinausgehen (z.B. Sammelgut
 * Eingang 23:00-05:00), werden als zwei Teilintervalle abgebildet.
 */
export type TrafficTypeTag2 = 'sge' | 'sga' | 'nva' | 'nve' | 'le' | 'la';

export const TRAFFIC_LABELS_2: Record<TrafficTypeTag2 | 'hofbestand', string> = {
  sge: 'Sammelgut Eingang',
  sga: 'Sammelgut Ausgang',
  nva: 'Nahverkehr Ausgang',
  nve: 'Nahverkehr Eingang',
  le: 'Leerbrücke Eingang',
  la: 'Leerbrücke Ausgang',
  hofbestand: 'Hofbestand',
};

export function trafficLabel2(tag: string | undefined): string {
  if (!tag) return 'Wechselbrücke';
  return (TRAFFIC_LABELS_2 as Record<string, string>)[tag] ?? tag;
}

/** [Start, Ende) in Minuten seit Mitternacht, ggf. mehrere Teilintervalle bei Mitternachts-Überlauf. */
export type TimeWindow = [number, number];

const SGE_WINDOWS: TimeWindow[] = [
  [23 * 60, 24 * 60],
  [0, 5 * 60],
];
const SGA_WINDOWS: TimeWindow[] = [[18 * 60, 23 * 60]];
const NVA_WINDOWS: TimeWindow[] = [[6 * 60, 8 * 60]];
const NVE_WINDOWS: TimeWindow[] = [[11 * 60, 18 * 60]];

export const TRAFFIC_WINDOWS: Record<TrafficTypeTag2, TimeWindow[]> = {
  sge: SGE_WINDOWS,
  sga: SGA_WINDOWS,
  nva: NVA_WINDOWS,
  nve: NVE_WINDOWS,
  // Leerbrücken nutzen laut Vorgabe die "Eingangszeiten" bzw. "Ausgangszeiten" -
  // also die Vereinigung der jeweiligen beladenen Fenster.
  le: [...SGE_WINDOWS, ...NVE_WINDOWS],
  la: [...SGA_WINDOWS, ...NVA_WINDOWS],
};

/** Tor-Nummernbereich [min, max] je Verkehrsart (nur für sge/sga bzw. nva/nve relevant). */
export const GATE_RANGES: Partial<Record<TrafficTypeTag2, [number, number]>> = {
  sge: [54, 95],
  sga: [54, 95],
  nva: [1, 41],
  nve: [1, 41],
};

/** Verkehrsarten, die beim Erreichen ihres Tors System+1 zählen (kommen beladen an). */
export function arrivesLoaded(tag: TrafficTypeTag2): boolean {
  return tag === 'sge' || tag === 'nve';
}

/** Verkehrsarten, die eine leere Ladeeinheit von LEWB abholen und beladen wieder rausfahren. */
export function departsLoaded(tag: TrafficTypeTag2): boolean {
  return tag === 'sga' || tag === 'nva';
}

export function pickRandomTimeInWindows(rng: () => number, windows: TimeWindow[]): number {
  const totalMinutes = windows.reduce((sum, [start, end]) => sum + (end - start), 0);
  let offset = rng() * totalMinutes;
  for (const [start, end] of windows) {
    const span = end - start;
    if (offset < span) return Math.floor(start + offset);
    offset -= span;
  }
  const [start, end] = windows[windows.length - 1];
  return Math.floor((start + end) / 2);
}

export interface Scenario2Config {
  /** 0 = Zufallsmodus (Stückzahlen werden automatisch gewürfelt), 1 = Manuell (feste Stückzahlen unten). */
  mode: number;
  hofbestand: number;
  sge: number;
  sga: number;
  nva: number;
  nve: number;
  le: number;
  la: number;
}

export const SCENARIO2_DEFAULTS: Scenario2Config = {
  mode: 0,
  hofbestand: 10,
  sge: 8,
  sga: 8,
  nva: 6,
  nve: 6,
  le: 4,
  la: 4,
};

/** Untergrenze/Obergrenze für automatisch gewürfelte Stückzahlen im Zufallsmodus. */
export const RANDOM_COUNT_RANGE: [number, number] = [3, 12];

/** Simulierte 24-Stunden-Grenze in Minuten. */
export const DAY_MINUTES = 24 * 60;
