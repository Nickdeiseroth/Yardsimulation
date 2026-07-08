import { availableModes, useSimulationStore } from '../store/simulationStore';
import { trafficLabel2, type TrafficTypeTag2 } from '../simulation/modes/scenario2';
import { formatClock } from './timeFormat';

const EINGANG_TYPES: TrafficTypeTag2[] = ['sge', 'nve', 'le'];
const AUSGANG_TYPES: TrafficTypeTag2[] = ['sga', 'nva', 'la'];

interface TypeStats {
  tag: string;
  count: number;
  firstTime?: number;
  lastTime?: number;
}

function summarize(records: { tag: string; kind: string; time: number }[], kind: string, tags: string[]): TypeStats[] {
  return tags.map((tag) => {
    const matches = records.filter((r) => r.kind === kind && r.tag === tag);
    return {
      tag,
      count: matches.length,
      firstTime: matches.length ? Math.min(...matches.map((r) => r.time)) : undefined,
      lastTime: matches.length ? Math.max(...matches.map((r) => r.time)) : undefined,
    };
  });
}

/** Auswertung: Eingänge/Ausgänge je Verkehrsart mit Uhrzeitspanne, für Modi mit `showEvaluation`. */
export function EvaluationPanel() {
  const modeId = useSimulationStore((s) => s.modeId);
  const records = useSimulationStore((s) => s.snapshot.records);

  const modeDef = availableModes.find((m) => m.id === modeId);
  if (!modeDef?.showEvaluation) return null;

  const eingaenge = summarize(records, 'einfahrt', EINGANG_TYPES);
  const ausgaenge = summarize(records, 'einfahrt', AUSGANG_TYPES);
  const hofbestand = records.filter((r) => r.kind === 'bestand').length;
  const totalEingang = eingaenge.reduce((sum, s) => sum + s.count, 0);
  const totalAusgang = ausgaenge.reduce((sum, s) => sum + s.count, 0);

  const renderRows = (stats: TypeStats[]) =>
    stats.map((s) => (
      <tr key={s.tag}>
        <td>{trafficLabel2(s.tag)}</td>
        <td>{s.count}</td>
        <td>{s.firstTime !== undefined ? `${formatClock(s.firstTime)}–${formatClock(s.lastTime!)}` : '–'}</td>
      </tr>
    ));

  return (
    <div className="panel">
      <h3>Auswertung</h3>
      <div className="stats-row">
        <span>Hofbestand (Start, im System gebucht)</span>
        <strong>{hofbestand}</strong>
      </div>
      <div className="stats-row">
        <span>Eingänge gesamt</span>
        <strong>{totalEingang}</strong>
      </div>
      <div className="stats-row">
        <span>Ausgänge gesamt</span>
        <strong>{totalAusgang}</strong>
      </div>
      <table className="zone-occupancy-table">
        <thead>
          <tr>
            <th>Eingang</th>
            <th>Anzahl</th>
            <th>Zeitraum</th>
          </tr>
        </thead>
        <tbody>{renderRows(eingaenge)}</tbody>
      </table>
      <table className="zone-occupancy-table">
        <thead>
          <tr>
            <th>Ausgang</th>
            <th>Anzahl</th>
            <th>Zeitraum</th>
          </tr>
        </thead>
        <tbody>{renderRows(ausgaenge)}</tbody>
      </table>
    </div>
  );
}
