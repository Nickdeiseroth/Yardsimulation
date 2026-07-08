import './App.css';
import { useSimulationStore } from './store/simulationStore';
import { YardMap } from './visualization/YardMap';
import { Legend } from './visualization/Legend';
import { ControlPanel } from './visualization/ControlPanel';
import { EventLog } from './visualization/EventLog';
import { StatsPanel } from './visualization/StatsPanel';
import { ScenarioConfigPanel } from './visualization/ScenarioConfigPanel';
import { CounterPanel } from './visualization/CounterPanel';
import { ClockPanel } from './visualization/ClockPanel';
import { EvaluationPanel } from './visualization/EvaluationPanel';

function App() {
  const snapshot = useSimulationStore((s) => s.snapshot);

  return (
    <div className="app-layout">
      <header className="app-header">
        <h1>Yard-Simulation</h1>
        <p>Standardaufbau: LKW-, Wechselbrücken- und Sattelauflieger-Bewegungen auf dem Yard.</p>
      </header>

      <main className="app-main">
        <div className="map-column">
          <div className="map-card">
            <YardMap snapshot={snapshot} />
          </div>
          <div className="panel">
            <Legend />
          </div>
        </div>
        <aside className="side-column">
          <div className="panel">
            <ControlPanel />
          </div>
          <ClockPanel />
          <ScenarioConfigPanel />
          <CounterPanel />
          <EvaluationPanel />
          <div className="panel">
            <StatsPanel />
          </div>
          <div className="panel event-log">
            <EventLog />
          </div>
        </aside>
      </main>
    </div>
  );
}

export default App;
