/**
 * Szenario 1: feste Stückzahlen je Brückenart, mit Physisch-/System-Zählung.
 *
 * - Sgut-Brücke / NV-Brücke (identisches Verhalten): fährt rein (Physisch +1),
 *   wird an ein Tor gestellt (System +1), anschließend vom Rangierdienst an
 *   einen LEWB-Platz verbracht.
 * - Leere Brücke Eingang: fährt rein (Physisch +1), wird direkt bei LEWB
 *   abgestellt, ohne ein Tor anzufahren (kein System-Zähler).
 * - Leere Brücke Ausgang: steht bereits bei LEWB (Physisch +1, System +1 ab
 *   Szenario-Start), wird abgeholt und fährt direkt vom Hof (Physisch -1).
 */
export type TrafficTypeTag = 'sgut' | 'nv' | 'leer-ein' | 'leer-aus';

export const TRAFFIC_TYPE_LABELS: Record<TrafficTypeTag, string> = {
  sgut: 'Sgut-Brücke',
  nv: 'NV-Brücke',
  'leer-ein': 'Leere Brücke Eingang',
  'leer-aus': 'Leere Brücke Ausgang',
};

export function trafficTypeLabel(tag: string | undefined): string {
  if (!tag) return 'Brücke';
  return TRAFFIC_TYPE_LABELS[tag as TrafficTypeTag] ?? tag;
}

/** "Sgut" und "NV" verhalten sich laut Vorgabe identisch: Ankunft über ein Tor. */
export function arrivesViaGate(reference: string | undefined): reference is 'sgut' | 'nv' {
  return reference === 'sgut' || reference === 'nv';
}

export interface Scenario1Config {
  sgut: number;
  nv: number;
  leerEin: number;
  leerAus: number;
}

export const SCENARIO1_DEFAULTS: Scenario1Config = { sgut: 3, nv: 3, leerEin: 2, leerAus: 2 };
