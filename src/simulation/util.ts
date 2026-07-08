import type { CargoUnit, CargoUnitType, SlotOccupantType, Slot, YardLayout } from '../domain/types';
import type { SimulationState } from './state';

export function findFreeSlot(
  layout: YardLayout,
  state: SimulationState,
  zoneId: string,
  occupantType: SlotOccupantType,
): Slot | undefined {
  return layout.slots.find(
    (s) => s.zoneId === zoneId && s.accepts.includes(occupantType) && !state.slotOccupancy[s.id],
  );
}

/**
 * Wie `findFreeSlot`, aber nur unter Slots, deren numerische ID im Bereich
 * `[minId, maxId]` liegt - z.B. um LKW gezielt an ein Tor aus einem
 * bestimmten Nummernbereich zu schicken (siehe Szenario 2: Sammelgut-Tore
 * 54-95 vs. Nahverkehrs-Tore 01-41). Slots mit nicht-numerischer ID werden
 * ignoriert.
 */
export function findFreeSlotInIdRange(
  layout: YardLayout,
  state: SimulationState,
  zoneId: string,
  occupantType: SlotOccupantType,
  minId: number,
  maxId: number,
): Slot | undefined {
  return layout.slots.find((s) => {
    if (s.zoneId !== zoneId || !s.accepts.includes(occupantType) || state.slotOccupancy[s.id]) return false;
    const numericId = Number(s.id);
    return Number.isFinite(numericId) && numericId >= minId && numericId <= maxId;
  });
}

/**
 * Findet einen Slot in `zoneId`, auf dem eine ungekoppelte, intakte Ladeeinheit
 * passenden Typs steht. Optionales `predicate` erlaubt zusätzliche Filter,
 * z.B. auf `cargo.reference` (Szenario-spezifische Verkehrstyp-Kennung).
 */
export function findAvailableCargoSlot(
  layout: YardLayout,
  state: SimulationState,
  zoneId: string,
  cargoType: CargoUnitType,
  predicate?: (cargo: CargoUnit) => boolean,
): Slot | undefined {
  return layout.slots.find((s) => {
    if (s.zoneId !== zoneId) return false;
    const occ = state.slotOccupancy[s.id];
    if (!occ?.cargoId || occ.truckId) return false;
    const cargo = state.cargoUnits[occ.cargoId];
    if (!cargo || cargo.type !== cargoType || cargo.defect) return false;
    return predicate ? predicate(cargo) : true;
  });
}

const PLATE_LETTERS = 'ABCDEFGHKLMNPRSTVWXYZ';

export function randomPlate(rng: () => number): string {
  const letters = Array.from({ length: 2 }, () => PLATE_LETTERS[Math.floor(rng() * PLATE_LETTERS.length)]).join('');
  const digits = Math.floor(rng() * 900 + 100);
  return `YS-${letters}-${digits}`;
}
