import { availableModes, useSimulationStore } from '../store/simulationStore';

/** Konfigurationsmaske: Felder, die der aktive Modus deklariert (Zahl oder Auswahl, z.B. Stückzahl je Brückenart). */
export function ScenarioConfigPanel() {
  const modeId = useSimulationStore((s) => s.modeId);
  const scenarioConfig = useSimulationStore((s) => s.scenarioConfig);
  const setConfigValue = useSimulationStore((s) => s.setConfigValue);
  const reset = useSimulationStore((s) => s.reset);

  const modeDef = availableModes.find((m) => m.id === modeId);
  const fields = modeDef?.configFields;
  if (!fields || fields.length === 0) return null;

  return (
    <div className="panel">
      <h3>Szenario-Konfiguration</h3>
      {fields.map((field) => {
        const disabled = field.disabledWhen?.(scenarioConfig) ?? false;
        return (
          <div className={`control-row${disabled ? ' control-row-disabled' : ''}`} key={field.key}>
            <label htmlFor={`scenario-field-${field.key}`}>{field.label}</label>
            {field.options ? (
              <select
                id={`scenario-field-${field.key}`}
                value={scenarioConfig[field.key] ?? field.defaultValue}
                disabled={disabled}
                onChange={(e) => setConfigValue(field.key, Number(e.target.value))}
              >
                {field.options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`scenario-field-${field.key}`}
                type="number"
                min={field.min ?? 0}
                max={field.max}
                disabled={disabled}
                value={scenarioConfig[field.key] ?? field.defaultValue}
                onChange={(e) => setConfigValue(field.key, Math.max(field.min ?? 0, Number(e.target.value) || 0))}
              />
            )}
          </div>
        );
      })}
      <div className="control-row">
        <button onClick={reset}>Szenario anwenden</button>
      </div>
    </div>
  );
}
