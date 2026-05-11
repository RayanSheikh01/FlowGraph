import GraphCanvas from './components/GraphCanvas';

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <div className="topic-input"></div>
        <div className="run-button"></div>
        <div className="connection-status"></div>
      </header>

      <main className="app-main">
        <div className="graph-canvas">
          <GraphCanvas />
        </div>

        <aside className="side-panel">
          <div className="hitl-panel"></div>
          <div className="state-inspector"></div>
        </aside>
      </main>
    </div>
  )
}

export default App
