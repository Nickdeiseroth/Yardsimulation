import type { CargoUnitType, ZoneKind } from '../domain/types';

export const zoneBackground: Record<ZoneKind, string> = {
  'swap-body-empty': '#eef6ee',
  'trailer-generic': '#eef2f9',
  'shunting-buffer': '#f5f5f0',
  dock: '#e9ecef',
  workshop: '#fdeee9',
  'shunting-service': '#f5f5f0',
  'defect-swap-body': '#fdecec',
  'trailer-parking': '#eef2f9',
  'car-park': '#f2f2f2',
};

export const cargoColor: Record<CargoUnitType, string> = {
  wechselbruecke: '#e8a33d',
  sattelauflieger: '#6a5acd',
};

export const defectColor = '#d64545';
export const emptySlotColor = '#d4d8dc';
export const truckOnlyColor = '#3a7bd5';
export const slotStrokeColor = '#555';
