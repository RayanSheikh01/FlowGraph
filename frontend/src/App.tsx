import { useState } from 'react'
import GraphCanvas from './components/GraphCanvas'
import { useGraphSocket } from './hooks/useGraphSocket'
import { useGraphStore } from './store'
import { HitlPanel } from './components/HitlPanel'
import { StateInspector } from './components/StateInspector'

function App() {
  const { start, resume } = useGraphSocket()
  const connectionStatus = useGraphStore((s) => s.connectionStatus)
  const flowState = useGraphStore((s) => s.flowState)
  const done = useGraphStore((s) => s.done)
  const wsError = useGraphStore((s) => s.error)
  const clearError = useGraphStore((s) => s.clearError)

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

  const stateError = flowState?.error ?? null
  const errorMessage = wsError?.message ?? stateError
  const errorNode = wsError?.node ?? null
  const sendSucceeded = done?.state.email_sent === true
  const sendFailed = done !== null && done.state.email_sent !== true

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

      {(sendSucceeded || sendFailed || errorMessage) && (
        <div className="banner-row">
          {sendSucceeded && (
            <div className="banner banner--success">
              <strong>Email sent.</strong>
              {done?.state.message_id && (
                <span className="banner__meta">
                  Message-ID: <code>{done.state.message_id}</code>
                </span>
              )}
            </div>
          )}
          {sendFailed && !errorMessage && (
            <div className="banner banner--error">
              <strong>Email send failed.</strong>
            </div>
          )}
          {errorMessage && (
            <div className="banner banner--error">
              <strong>
                Error{errorNode ? ` in ${errorNode}` : ''}:
              </strong>
              <span className="banner__meta">{errorMessage}</span>
              {wsError && (
                <button
                  className="banner__dismiss"
                  onClick={clearError}
                  aria-label="Dismiss error"
                >
                  ×
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <main className="app-main">
        <div className="graph-canvas">
          <GraphCanvas />
        </div>

        <aside className="side-panel">
          <div className="hitl-panel">
            <HitlPanel resume={resume} />
          </div>
          <div className="state-inspector">
            <StateInspector />
          </div>
        </aside>
      </main>
    </div>
  )
}

export default App
