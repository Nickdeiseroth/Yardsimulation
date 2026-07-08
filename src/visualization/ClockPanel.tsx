import { availableModes, useSimulationStore } from '../store/simulationStore';
import { DAY_MINUTES, formatClock } from './timeFormat';

/** Große Uhrzeitanzeige mit 24h-Fortschrittsbalken, für uhrzeitgebundene Modi (siehe `showClock`). */
export function ClockPanel() {
  const modeId = useSimulationStore((s) => s.modeId);
  const time = useSimulationStore((s) => s.snapshot.time);

  const modeDef = availableModes.find((m) => m.id === modeId);
  if (!modeDef?.showClock) return null;

  const dayProgress = Math.min(100, (time / DAY_MINUTES) * 100);
  const finished = time >= DAY_MINUTES;

  return (
    <div className="panel clock-panel">
      <h3>Uhrzeit</h3>
      <div className="clock-readout">{formatClock(time)}</div>
      <div className="clock-sub">{finished ? 'Simulationstag abgeschlossen' : 'läuft...'}</div>
      <div className="clock-progress-track">
        <div className="clock-progress-fill" style={{ width: `${dayProgress}%` }} />
      </div>
    </div>
  );
}
