import type { CargoUnitType, ZoneKind } from '../domain/types';

// Deutlich gesättigter als reine Pastelltöne, damit sich die Zonen auch ohne
// aktive LKW auf den ersten Blick unterscheiden lassen.
export const zoneBackground: Record<ZoneKind, string> = {
  'swap-body-empty': '#bfe8c3', // LEWB - grün
  'trailer-generic': '#bfd6f5', // ANG - blau
  'shunting-buffer': '#e8e3c8', // UMW/UMO - sandfarben
  dock: '#cfd8e2', // Laderampen - kühles Blaugrau
  workshop: '#f4c9a8', // WKST - orange
  'shunting-service': '#f2e08a', // PPRD - gelb
  'defect-swap-body': '#f2b0b0', // DEF - rot
  'trailer-parking': '#d6c3ef', // SA - violett
  'car-park': '#dcdcd2', // PP - neutral
};

export const cargoColor: Record<CargoUnitType, string> = {
  wechselbruecke: '#e8a33d',
  sattelauflieger: '#6a5acd',
};

export const defectColor = '#d64545';
export const emptySlotColor = '#f4f5f2';
export const truckOnlyColor = '#3a7bd5';
export const slotStrokeColor = '#4a4a44';
