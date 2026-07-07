import './App.css';
import { useSimulationStore } from './store/simulationStore';
import { YardMap } from './visualization/YardMap';
import { Legend } from './visualization/Legend';
import { ControlPanel } from './visualization/ControlPanel';
import { EventLog } from './visualization/EventLog';
import { StatsPanel } from './visualization/StatsPanel';

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
          <YardMap snapshot={snapshot} />
          <Legend />
        </div>
        <aside className="side-column">
          <ControlPanel />
          <StatsPanel />
          <EventLog />
        </aside>
      </main>
    </div>
  );
}

export default App;
