import { availableModes, useSimulationStore } from '../store/simulationStore';

function formatSimTime(minutes: number): string {
  const totalMinutes = Math.floor(minutes);
  const days = Math.floor(totalMinutes / (24 * 60));
  const h = Math.floor((totalMinutes % (24 * 60)) / 60)
    .toString()
    .padStart(2, '0');
  const m = (totalMinutes % 60).toString().padStart(2, '0');
  return days > 0 ? `Tag ${days + 1}, ${h}:${m}` : `${h}:${m}`;
}

export function ControlPanel() {
  const running = useSimulationStore((s) => s.running);
  const speed = useSimulationStore((s) => s.speed);
  const modeId = useSimulationStore((s) => s.modeId);
  const time = useSimulationStore((s) => s.snapshot.time);
  const play = useSimulationStore((s) => s.play);
  const pause = useSimulationStore((s) => s.pause);
  const step = useSimulationStore((s) => s.step);
  const reset = useSimulationStore((s) => s.reset);
  const setSpeed = useSimulationStore((s) => s.setSpeed);
  const setMode = useSimulationStore((s) => s.setMode);

  return (
    <div className="control-panel">
      <div className="control-row">
        <label htmlFor="mode-select">Modus</label>
        <select id="mode-select" value={modeId} onChange={(e) => setMode(e.target.value)}>
          {availableModes.map((m) => (
            <option key={m.id} value={m.id} title={m.description}>
              {m.label}
            </option>
          ))}
        </select>
      </div>

      <div className="control-row">
        <button onClick={running ? pause : play}>{running ? '⏸ Pause' : '▶ Start'}</button>
        <button onClick={step} disabled={running}>
          ⏭ Schritt
        </button>
        <button onClick={reset}>⟲ Reset</button>
      </div>

      <div className="control-row">
        <label htmlFor="speed-range">Geschwindigkeit ({speed}×)</label>
        <input
          id="speed-range"
          type="range"
          min={1}
          max={20}
          step={1}
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value))}
        />
      </div>

      <div className="control-row sim-time">Simulationszeit: {formatSimTime(time)}</div>
    </div>
  );
}
