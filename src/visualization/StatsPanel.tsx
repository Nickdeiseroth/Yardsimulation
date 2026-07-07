import { yardLayout } from '../domain/yardLayout';
import { useSimulationStore } from '../store/simulationStore';

export function StatsPanel() {
  const snapshot = useSimulationStore((s) => s.snapshot);

  const activeTrucks = Object.keys(snapshot.trucks).length;
  const gateQueue = snapshot.gateQueue.length;

  const occupancyByZone = yardLayout.zones.map((zone) => {
    const slots = yardLayout.slots.filter((s) => s.zoneId === zone.id);
    const occupied = slots.filter((s) => snapshot.slotOccupancy[s.id]).length;
    return { zone, occupied, total: slots.length };
  });

  return (
    <>
      <h3>Kennzahlen</h3>
      <div className="stats-row">
        <span>Aktive LKW im Yard</span>
        <strong>{activeTrucks}</strong>
      </div>
      <div className="stats-row">
        <span>Warteschlange am Gate</span>
        <strong>{gateQueue}</strong>
      </div>
      <table className="zone-occupancy-table">
        <thead>
          <tr>
            <th>Zone</th>
            <th>Belegt</th>
          </tr>
        </thead>
        <tbody>
          {occupancyByZone.map(({ zone, occupied, total }) => (
            <tr key={zone.id}>
              <td title={zone.description}>{zone.label}</td>
              <td>
                {occupied} / {total}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
