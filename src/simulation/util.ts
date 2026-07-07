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
