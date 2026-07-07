import { yardLayout } from '../domain/yardLayout';
import type { SimulationState } from '../simulation/state';
import { SlotRect } from './SlotRect';
import { TruckMarker } from './TruckMarker';
import { getTruckMarkerPosition } from './truckPosition';
import { GATE, roadNetworkPolyline } from './roadNetwork';
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
const roadPathD = roadNetworkPolyline.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

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
  const activeTrucks = Object.values(snapshot.trucks).filter((t) => t.status !== 'departed');

  return (
    <svg
      viewBox={`0 0 ${yardLayout.bounds.width} ${yardLayout.bounds.height}`}
      role="img"
      aria-label="Yard-Plan mit Live-Belegung und Fahrtwegen"
      className="yard-map"
    >
      <defs>
        <linearGradient id="yard-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--map-bg-top)" />
          <stop offset="100%" stopColor="var(--map-bg-bottom)" />
        </linearGradient>
        <filter id="slot-shadow" x="-40%" y="-40%" width="180%" height="180%">
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.6" floodOpacity="0.25" />
        </filter>
      </defs>

      <rect x={0} y={0} width={yardLayout.bounds.width} height={yardLayout.bounds.height} fill="url(#yard-bg)" />

      {zoneBounds.map(({ zone, x, y, width, height }) => (
        <rect
          key={zone.id}
          x={x}
          y={y}
          width={width}
          height={height}
          fill={zoneBackground[zone.kind]}
          stroke="var(--zone-border)"
          strokeWidth={0.75}
          rx={6}
        />
      ))}

      {/* Halle als dekorativer Baukörper zwischen den Laderampen-Reihen */}
      <rect x={115} y={335} width={895} height={320} fill="var(--hall-fill)" stroke="var(--hall-stroke)" strokeWidth={1.5} rx={3} />
      <text x={562} y={500} textAnchor="middle" fontSize={24} fill="var(--hall-label)" fontWeight={600} letterSpacing={2}>
        HALLE
      </text>

      {/* Straßennetz, entlang dessen sich LKW bewegen */}
      <path d={roadPathD} fill="none" stroke="var(--road-fill)" strokeWidth={10} strokeLinejoin="round" strokeLinecap="round" />
      <path
        d={roadPathD}
        fill="none"
        stroke="var(--road-dash)"
        strokeWidth={1}
        strokeDasharray="6 6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />

      {/* Gate */}
      <g transform={`translate(${GATE.x} ${GATE.y})`}>
        <circle r={9} fill="var(--gate-fill)" stroke="#fff" strokeWidth={1.5} />
        <text x={0} y={22} textAnchor="middle" fontSize={13} fill="var(--gate-label)" fontWeight={600}>
          Gate
        </text>
      </g>

      {zoneLabels.map((zl) => (
        <text
          key={zl.zoneId}
          x={zl.x}
          y={zl.y}
          fontSize={17}
          fill="var(--zone-label)"
          fontWeight={600}
          textAnchor="middle"
          transform={zl.rotate ? `rotate(${zl.rotate} ${zl.x} ${zl.y})` : undefined}
        >
          {zl.text}
        </text>
      ))}

      <g filter="url(#slot-shadow)">
        {yardLayout.slots.map((slot) => {
          const occupant = snapshot.slotOccupancy[slot.id];
          const truck = occupant?.truckId ? snapshot.trucks[occupant.truckId] : undefined;
          const cargo = occupant?.cargoId ? snapshot.cargoUnits[occupant.cargoId] : undefined;
          return <SlotRect key={slot.id} slot={slot} occupant={occupant} truck={truck} cargo={cargo} />;
        })}
      </g>

      {activeTrucks.map((truck) => {
        const { point, heading } = getTruckMarkerPosition(truck, snapshot);
        return (
          <TruckMarker
            key={truck.id}
            x={point.x}
            y={point.y}
            heading={heading}
            cargoType={truck.cargo?.type}
            moving={truck.status === 'moving'}
            label={`${truck.id} (${truck.licensePlate})${truck.cargo ? ` – ${truck.cargo.type} ${truck.cargo.id}` : ' – solo'}`}
          />
        );
      })}
    </svg>
  );
}
