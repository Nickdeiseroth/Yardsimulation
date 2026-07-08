import type { CargoUnit, Slot, Truck } from '../domain/types';
import type { SlotOccupant } from '../simulation/state';
import { cargoColor, defectColor, emptySlotColor, slotStrokeColor, truckOnlyColor } from './colors';
import { cargoReferenceLabel } from './cargoLabel';

interface SlotRectProps {
  slot: Slot;
  occupant?: SlotOccupant;
  truck?: Truck;
  cargo?: CargoUnit;
}

function fillFor(occupant: SlotOccupant | undefined, truck: Truck | undefined, cargo: CargoUnit | undefined): string {
  if (!occupant) return emptySlotColor;
  if (cargo) return cargo.defect ? defectColor : cargoColor[cargo.type];
  if (truck) return truckOnlyColor;
  return emptySlotColor;
}

export function SlotRect({ slot, occupant, truck, cargo }: SlotRectProps) {
  const fill = fillFor(occupant, truck, cargo);
  const rotation = slot.rotation ?? 0;
  const cx = slot.x + slot.width / 2;
  const cy = slot.y + slot.height / 2;

  const titleParts = [`Slot ${slot.id}${slot.altId ? ` / ${slot.altId}` : ''}`];
  if (truck) titleParts.push(`LKW ${truck.id} (${truck.licensePlate})`);
  if (cargo) {
    const label = cargoReferenceLabel(cargo.reference);
    titleParts.push(`${cargo.type}${cargo.defect ? ' [defekt]' : ''} ${cargo.id}${label ? ` – ${label}` : ''}`);
  }

  return (
    <g transform={rotation ? `rotate(${rotation} ${cx} ${cy})` : undefined}>
      <title>{titleParts.join(' – ')}</title>
      <rect
        x={slot.x}
        y={slot.y}
        width={slot.width}
        height={slot.height}
        fill={fill}
        stroke={slotStrokeColor}
        strokeWidth={0.75}
        rx={1.5}
      />
      {slot.width >= 12 && (
        <text
          x={cx}
          y={cy}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={slot.width > 40 ? 8 : 5.5}
          fill="#222"
          transform={rotation ? `rotate(${-rotation} ${cx} ${cy})` : undefined}
        >
          {slot.id}
        </text>
      )}
    </g>
  );
}
