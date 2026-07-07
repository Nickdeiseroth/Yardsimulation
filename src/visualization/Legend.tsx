import { cargoColor, defectColor, emptySlotColor, truckOnlyColor } from './colors';

const entries: { color: string; label: string }[] = [
  { color: emptySlotColor, label: 'Frei' },
  { color: truckOnlyColor, label: 'LKW (an Rampe, noch beladen)' },
  { color: cargoColor.wechselbruecke, label: 'Wechselbrücke abgestellt' },
  { color: cargoColor.sattelauflieger, label: 'Sattelauflieger abgestellt' },
  { color: defectColor, label: 'Defekte Ladeeinheit' },
];

export function Legend() {
  return (
    <div className="legend">
      {entries.map((e) => (
        <div className="legend-item" key={e.label}>
          <span className="legend-swatch" style={{ background: e.color }} />
          <span>{e.label}</span>
        </div>
      ))}
    </div>
  );
}
