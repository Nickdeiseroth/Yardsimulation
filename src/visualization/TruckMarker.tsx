import type { CargoUnitType } from '../domain/types';
import { cargoColor, truckOnlyColor } from './colors';

interface TruckMarkerProps {
  x: number;
  y: number;
  heading: number;
  cargoType?: CargoUnitType;
  label: string;
  moving: boolean;
}

const BODY_LENGTH = 22;
const BODY_WIDTH = 9;

export function TruckMarker({ x, y, heading, cargoType, label, moving }: TruckMarkerProps) {
  const fill = cargoType ? cargoColor[cargoType] : truckOnlyColor;

  return (
    <g
      style={{
        transform: `translate(${x}px, ${y}px) rotate(${heading}deg)`,
        transformOrigin: '0px 0px',
        // Bei Bewegung wird die Position bereits jeden Animationsframe exakt
        // berechnet (siehe TruckLayer/subTickProgress) - nur eine minimale
        // Transition, um Frame-Timing-Jitter zu glätten, ohne spürbar
        // hinterherzuhinken. Beim Einparken (Statuswechsel) etwas mehr Ease.
        transition: moving ? 'transform 0.1s linear' : 'transform 0.25s ease-out',
      }}
    >
      <title>{label}</title>
      <rect
        x={-BODY_LENGTH / 2}
        y={-BODY_WIDTH / 2}
        width={BODY_LENGTH}
        height={BODY_WIDTH}
        rx={2}
        fill={fill}
        stroke="#2a2a2a"
        strokeWidth={0.8}
      />
      <rect x={BODY_LENGTH / 2 - 6} y={-BODY_WIDTH / 2} width={6} height={BODY_WIDTH} rx={1.5} fill="#333" />
    </g>
  );
}
