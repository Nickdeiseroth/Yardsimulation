import { availableModes, useSimulationStore } from '../store/simulationStore';

/** Zeigt die vom aktiven Modus geführten, benannten Zähler an (z.B. Physisch/System in Szenario 1). */
export function CounterPanel() {
  const modeId = useSimulationStore((s) => s.modeId);
  const counters = useSimulationStore((s) => s.snapshot.counters);

  const modeDef = availableModes.find((m) => m.id === modeId);
  const definitions = modeDef?.counterDefinitions;
  if (!definitions || definitions.length === 0) return null;

  return (
    <div className="panel">
      <h3>Zähler</h3>
      <div className="counter-grid">
        {definitions.map((def) => (
          <div className="counter-tile" key={def.key}>
            <div className="value">{counters[def.key] ?? 0}</div>
            <div className="label">{def.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
