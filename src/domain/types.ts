/**
 * Kern-Domänenmodell des Yards.
 *
 * Dieses Modell ist bewusst neutral gehalten: Es beschreibt Zonen, Stellplätze,
 * Fahrzeuge und Ladeeinheiten so, wie sie im Yard-Plan vorkommen - unabhängig
 * davon, welcher Simulationsmodus später darauf aufsetzt ("Baukasten"-Prinzip).
 */

/** Fachliche Kategorie einer Zone im Yard (aus dem Lageplan abgeleitet). */
export type ZoneKind =
  | 'swap-body-empty' // LEWB - Leerwechselbrücken
  | 'trailer-generic' // ANG - Anhänger/Wechselbrücken-Stellflächen
  | 'shunting-buffer' // UMW/UMO - Umsetz-/Pufferflächen an der Halle
  | 'dock' // Laderampen an der Halle (nummerierte Tore)
  | 'workshop' // WKST - Werkstatt
  | 'shunting-service' // PPRD - Rang.D. (Rangierdienst)
  | 'defect-swap-body' // DEF - Def. WB (defekte Wechselbrücken)
  | 'trailer-parking' // SA - Abstellfläche Sattel
  | 'car-park'; // PP - Pkw-Parkplätze (kein LKW-Verkehr)

/** Welche Ladeeinheiten/Fahrzeuge an einem Slot grundsätzlich erlaubt sind. */
export type CargoUnitType = 'wechselbruecke' | 'sattelauflieger';

export type SlotOccupantType = CargoUnitType | 'truck-only';

/** Ein einzelner Stellplatz, wie er als nummeriertes Rechteck im Plan auftaucht. */
export interface Slot {
  /** Eindeutige, stabile ID - im Plan meist die "obere"/erste Beschriftung. */
  id: string;
  /** Zweite Beschriftung, falls der Slot im Plan an beiden Enden nummeriert ist. */
  altId?: string;
  zoneId: string;
  /** Position im SVG-Koordinatenraum des Yard-Plans (siehe visualization/layout). */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Rotation in Grad, für vertikale/schräge Stellplätze (z.B. UMW, PP). */
  rotation?: number;
  /** Welche Ladeeinheiten hier grundsätzlich abgestellt werden dürfen. */
  accepts: SlotOccupantType[];
  capacity: number;
}

export interface Zone {
  id: string;
  label: string;
  description: string;
  kind: ZoneKind;
}

export interface YardLayout {
  zones: Zone[];
  slots: Slot[];
  /** Bounding-Box des Plans, für die SVG-Visualisierung. */
  bounds: { width: number; height: number };
}

/** Eine Ladeeinheit: Wechselbrücke oder Sattelauflieger. */
export interface CargoUnit {
  id: string;
  type: CargoUnitType;
  /** Kundenreferenz/Ladung, rein informativ für den Baukasten. */
  reference?: string;
  defect: boolean;
}

export type TruckStatus =
  | 'en-route-to-gate'
  | 'moving'
  | 'parked'
  | 'at-dock'
  | 'departed';

/** Ein LKW/Zugmaschine, die optional eine Ladeeinheit gekoppelt hat. */
export interface Truck {
  id: string;
  licensePlate: string;
  status: TruckStatus;
  /** Slot, an dem der LKW aktuell steht (falls geparkt). */
  currentSlotId?: string;
  /** Ziel-Slot, falls gerade in Bewegung. */
  targetSlotId?: string;
  cargo?: CargoUnit;
  /** Simulationszeit (Minuten) der geplanten Abfahrt. */
  plannedDepartureAt?: number;
}

export interface SlotAssignment {
  slotId: string;
  truckId?: string;
  /** Ladeeinheit kann auch ohne Zugmaschine auf dem Slot stehen (abgestellt). */
  cargoId?: string;
}
