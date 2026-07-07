import { cargoColor, defectColor, emptySlotColor, truckOnlyColor } from './colors';

const slotEntries: { color: string; label: string }[] = [
  { color: emptySlotColor, label: 'Slot frei' },
  { color: cargoColor.wechselbruecke, label: 'Wechselbrücke abgestellt' },
  { color: cargoColor.sattelauflieger, label: 'Sattelauflieger abgestellt' },
  { color: defectColor, label: 'Defekte Ladeeinheit' },
];

const truckEntries: { color: string; label: string }[] = [
  { color: truckOnlyColor, label: 'LKW solo (Bobtail)' },
  { color: cargoColor.wechselbruecke, label: 'LKW mit Wechselbrücke' },
  { color: cargoColor.sattelauflieger, label: 'LKW mit Sattelauflieger' },
];

export function Legend() {
  return (
    <>
      <h3>Legende</h3>
      <div className="legend">
        {slotEntries.map((e) => (
          <div className="legend-item" key={e.label}>
            <span className="legend-swatch" style={{ background: e.color }} />
            <span>{e.label}</span>
          </div>
        ))}
        {truckEntries.map((e) => (
          <div className="legend-item" key={e.label}>
            <span className="legend-swatch truck-swatch" style={{ background: e.color }} />
            <span>{e.label}</span>
          </div>
        ))}
        <div className="legend-item">
          <span className="legend-swatch road-swatch" style={{ color: 'var(--road-fill)' }} />
          <span>Fahrweg</span>
        </div>
      </div>
    </>
  );
}
