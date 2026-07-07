import { useSimulationStore } from '../store/simulationStore';

function formatTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export function EventLog() {
  const events = useSimulationStore((s) => s.snapshot.events);

  return (
    <div className="event-log">
      <h3>Ereignisprotokoll</h3>
      <ul>
        {[...events]
          .slice(-50)
          .reverse()
          .map((e, i) => (
            <li key={`${e.time}-${i}`}>
              <span className="event-time">{formatTime(e.time)}</span> {e.message}
            </li>
          ))}
      </ul>
    </div>
  );
}
