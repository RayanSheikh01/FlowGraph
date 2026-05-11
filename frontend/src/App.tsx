import { useState } from 'react'
import GraphCanvas from './components/GraphCanvas'
import { useGraphSocket } from './hooks/useGraphSocket'
import { useGraphStore } from './store'
import { HitlPanel } from './components/HitlPanel'

function App() {
  const { start, resume } = useGraphSocket()
  const connectionStatus = useGraphStore((s) => s.connectionStatus)
  const flowState = useGraphStore((s) => s.flowState)
  const done = useGraphStore((s) => s.done)

  const [topic, setTopic] = useState('')
  const [recipient, setRecipient] = useState('')

  const isRunning = flowState !== null && done === null
  const canRun =
    connectionStatus === 'open' &&
    topic.trim().length > 0 &&
    recipient.trim().length > 0 &&
    !isRunning

  const onRun = () => {
    if (!canRun) return
    start(topic.trim(), recipient.trim())
  }

  return (
    <div className="app">
      <header className="app-header">
        <input
          className="topic-input"
          type="text"
          placeholder="Enter topic or task..."
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />
        <input
          className="recipient-input"
          type="email"
          placeholder="Recipient email..."
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        <button className="run-button" onClick={onRun} disabled={!canRun}>
          Run
        </button>
        <div className={`connection-status connection-status--${connectionStatus}`}>
          <span className="connection-dot" />
          {connectionStatus}
        </div>
      </header>

      <main className="app-main">
        <div className="graph-canvas">
          <GraphCanvas />
        </div>

        <aside className="side-panel">
          <div className="hitl-panel">
            <HitlPanel resume={resume} />
          </div>
          <div className="state-inspector"></div>
        </aside>
      </main>
    </div>
  )
}

export default App
