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

const CAB_LENGTH = 9;
const TRAILER_LENGTH = 24;
const TOTAL_LENGTH = CAB_LENGTH + TRAILER_LENGTH;
const WIDTH = 13;
const HALF_LEN = TOTAL_LENGTH / 2;
const HALF_WIDTH = WIDTH / 2;
const CAB_X = HALF_LEN - CAB_LENGTH;
const WHEEL_R = 2.1;

export function TruckMarker({ x, y, heading, cargoType, label, moving }: TruckMarkerProps) {
  const trailerFill = cargoType ? cargoColor[cargoType] : truckOnlyColor;

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

      {/* Schattenwurf, damit das Symbol auf jedem Untergrund (hell/dunkel, Zonenfarbe, Straße) gut sichtbar bleibt */}
      <rect x={-HALF_LEN + 0.8} y={-HALF_WIDTH + 1.1} width={TOTAL_LENGTH} height={WIDTH} rx={2.5} fill="rgba(0,0,0,0.35)" />

      {/* Räder */}
      <circle cx={-HALF_LEN + 6} cy={-HALF_WIDTH - 0.5} r={WHEEL_R} fill="#1a1a1a" />
      <circle cx={-HALF_LEN + 6} cy={HALF_WIDTH + 0.5} r={WHEEL_R} fill="#1a1a1a" />
      <circle cx={CAB_X + CAB_LENGTH / 2} cy={-HALF_WIDTH - 0.5} r={WHEEL_R} fill="#1a1a1a" />
      <circle cx={CAB_X + CAB_LENGTH / 2} cy={HALF_WIDTH + 0.5} r={WHEEL_R} fill="#1a1a1a" />

      {/* Trailer / Ladeeinheit */}
      <rect
        x={-HALF_LEN}
        y={-HALF_WIDTH}
        width={TRAILER_LENGTH}
        height={WIDTH}
        rx={2}
        fill={trailerFill}
        stroke="#ffffff"
        strokeWidth={1.4}
      />

      {/* Zugmaschine (Kabine), immer an der Fahrtrichtungs-Spitze */}
      <rect x={CAB_X} y={-HALF_WIDTH} width={CAB_LENGTH} height={WIDTH} rx={1.8} fill="#20242c" stroke="#ffffff" strokeWidth={1.4} />
      <rect x={CAB_X + 2} y={-HALF_WIDTH + 2.2} width={CAB_LENGTH - 4} height={WIDTH - 4.4} rx={0.8} fill="#a9d8ff" opacity={0.9} />
    </g>
  );
}
