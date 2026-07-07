import { yardLayout } from '../domain/yardLayout';
import type { SimulationState } from '../simulation/state';
import { SlotRect } from './SlotRect';
import { zoneBackground } from './colors';

const ZONE_PADDING = 8;

function computeZoneBounds() {
  return yardLayout.zones.map((zone) => {
    const slots = yardLayout.slots.filter((s) => s.zoneId === zone.id);
    const xs = slots.flatMap((s) => [s.x, s.x + s.width]);
    const ys = slots.flatMap((s) => [s.y, s.y + s.height]);
    const x = Math.min(...xs) - ZONE_PADDING;
    const y = Math.min(...ys) - ZONE_PADDING;
    const width = Math.max(...xs) - Math.min(...xs) + ZONE_PADDING * 2;
    const height = Math.max(...ys) - Math.min(...ys) + ZONE_PADDING * 2;
    return { zone, x, y, width, height };
  });
}

const zoneBounds = computeZoneBounds();

interface ZoneLabel {
  zoneId: string;
  text: string;
  x: number;
  y: number;
  rotate?: number;
}

const zoneLabels: ZoneLabel[] = [
  { zoneId: 'lewb', text: 'LEWB', x: 165, y: 40 },
  { zoneId: 'ang', text: 'ANG', x: 830, y: 40 },
  { zoneId: 'umw', text: 'UMW', x: 30, y: 500, rotate: -90 },
  { zoneId: 'umo', text: 'UMO', x: 1195, y: 330, rotate: -90 },
  { zoneId: 'wkst', text: 'WKST', x: 1055, y: 650 },
  { zoneId: 'pprd', text: 'Rang.D.', x: 70, y: 905 },
  { zoneId: 'def', text: 'Def. WB', x: 175, y: 905 },
  { zoneId: 'sa', text: 'Abstellfläche Sattel', x: 400, y: 905 },
  { zoneId: 'pp', text: 'PP', x: 1080, y: 1085 },
];

interface YardMapProps {
  snapshot: SimulationState;
}

export function YardMap({ snapshot }: YardMapProps) {
  return (
    <svg
      viewBox={`0 0 ${yardLayout.bounds.width} ${yardLayout.bounds.height}`}
      role="img"
      aria-label="Yard-Plan mit Live-Belegung"
      style={{ width: '100%', height: 'auto', background: '#fbfbf8' }}
    >
      {zoneBounds.map(({ zone, x, y, width, height }) => (
        <rect
          key={zone.id}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={zoneBackground[zone.kind]}
          stroke="#c8c8c0"
          strokeWidth={0.5}
          rx={4}
        />
      ))}

      {/* Halle als dekorativer Baukörper zwischen den Laderampen-Reihen */}
      <rect x={115} y={335} width={895} height={320} fill="#d9d9d4" stroke="#888" strokeWidth={1} />
      <text x={562} y={500} textAnchor="middle" fontSize={22} fill="#777">
        Halle
      </text>

      {zoneLabels.map((zl) => (
        <text
          key={zl.zoneId}
          x={zl.x}
          y={zl.y}
          fontSize={18}
          fill="#333"
          textAnchor="middle"
          transform={zl.rotate ? `rotate(${zl.rotate} ${zl.x} ${zl.y})` : undefined}
        >
          {zl.text}
        </text>
      ))}

      {yardLayout.slots.map((slot) => {
        const occupant = snapshot.slotOccupancy[slot.id];
        const truck = occupant?.truckId ? snapshot.trucks[occupant.truckId] : undefined;
        const cargo = occupant?.cargoId ? snapshot.cargoUnits[occupant.cargoId] : undefined;
        return <SlotRect key={slot.id} slot={slot} occupant={occupant} truck={truck} cargo={cargo} />;
      })}
    </svg>
  );
}
