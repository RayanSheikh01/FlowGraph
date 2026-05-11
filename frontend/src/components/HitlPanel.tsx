import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { useGraphStore } from '../store'
import type { EmailDraft, HitlDecision, ResumePatch } from '../types'

const panel: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '1rem',
  padding: '1rem',
  border: '1px solid #ccc',
  borderRadius: '4px',
  backgroundColor: '#f9f9f9',
}

const buttonRow: CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
}

const textarea: CSSProperties = {
  width: '100%',
  minHeight: '6rem',
  fontFamily: 'inherit',
  fontSize: '0.9rem',
  padding: '0.5rem',
}

const EMPTY_EMAIL: EmailDraft = { to: '', subject: '', body: '' }

function isEmailDraft(value: unknown): value is EmailDraft {
  if (value === null || typeof value !== 'object') return false
  const v = value as Record<string, unknown>
  return (
    typeof v.to === 'string' &&
    typeof v.subject === 'string' &&
    typeof v.body === 'string'
  )
}

interface HitlPanelProps {
  resume: (decision: HitlDecision, patch?: ResumePatch) => boolean
}

export const HitlPanel = ({ resume }: HitlPanelProps) => {
  const interrupt = useGraphStore((s) => s.interrupt)
  const flowState = useGraphStore((s) => s.flowState)
  const done = useGraphStore((s) => s.done)
  const error = useGraphStore((s) => s.error)
  const clearInterrupt = useGraphStore((s) => s.clearInterrupt)

  const [summaryDraft, setSummaryDraft] = useState('')
  const [emailDraft, setEmailDraft] = useState<EmailDraft>(EMPTY_EMAIL)
  const [submitting, setSubmitting] = useState(false)

  // Seed editable drafts only when a new interrupt arrives. Depending on
  // flowState here would re-fire on every state_update — re-enabling the
  // buttons before the next interrupt arrives and clobbering user edits.
  useEffect(() => {
    if (!interrupt) {
      setSubmitting(false)
      return
    }
    const fs = useGraphStore.getState().flowState
    if (interrupt.step === 'gate_summarize') {
      const preview = typeof interrupt.preview === 'string' ? interrupt.preview : null
      setSummaryDraft(preview ?? fs?.summary ?? '')
    } else if (interrupt.step === 'gate_email') {
      const preview = isEmailDraft(interrupt.preview) ? interrupt.preview : null
      setEmailDraft(preview ?? fs?.email_draft ?? EMPTY_EMAIL)
    }
    setSubmitting(false)
  }, [interrupt])

  if (error) {
    return (
      <div style={{ ...panel, borderColor: '#c0392b' }}>
        <h3>Flow error</h3>
        <p>{error.message}</p>
        {error.node && <p style={{ opacity: 0.7 }}>Failing node: {error.node}</p>}
        <button onClick={() => window.location.reload()}>Start new flow</button>
      </div>
    )
  }

  if (done) {
    const wasRejected = !!done.state.error
    return (
      <div style={{ ...panel, borderColor: wasRejected ? '#c0392b' : '#27ae60' }}>
        <h3>{wasRejected ? 'Flow rejected' : 'Flow complete'}</h3>
        <p>
          {wasRejected
            ? done.state.error
            : `Email sent to ${done.state.email_draft?.to ?? ''}`}
        </p>
        <button onClick={() => window.location.reload()}>Start new flow</button>
      </div>
    )
  }

  if (!interrupt) {
    return (
      <div style={panel}>
        <h3>Awaiting interrupt</h3>
        {flowState ? (
          <p>Flow is running…</p>
        ) : (
          <p>No flow started yet.</p>
        )}
      </div>
    )
  }

  const send = (decision: HitlDecision, patch?: ResumePatch) => {
    if (submitting) return
    setSubmitting(true)
    const ok = resume(decision, patch)
    if (ok) {
      clearInterrupt()
    } else {
      setSubmitting(false)
    }
  }

  const onApprove = () => {
    if (interrupt.step === 'gate_summarize') {
      send('approve', { summary: summaryDraft })
    } else if (interrupt.step === 'gate_email') {
      send('approve', { email_draft: emailDraft })
    } else {
      send('approve')
    }
  }

  const onEdit = () => {
    if (interrupt.step === 'gate_summarize') {
      send('edit', { summary: summaryDraft })
    } else if (interrupt.step === 'gate_email') {
      send('edit', { email_draft: emailDraft })
    }
  }

  const onReject = () => send('reject')

  const canEdit =
    interrupt.step === 'gate_summarize' || interrupt.step === 'gate_email'

  return (
    <div style={panel}>
      <h3>Human Intervention Required</h3>
      <p>{interrupt.message}</p>

      {interrupt.step === 'gate_research' && (
        <ul>
          {(flowState?.research_results ?? []).map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.title}
              </a>
              <div>{r.snippet}</div>
            </li>
          ))}
        </ul>
      )}

      {interrupt.step === 'gate_summarize' && (
        <textarea
          style={textarea}
          value={summaryDraft}
          onChange={(e) => setSummaryDraft(e.target.value)}
        />
      )}

      {interrupt.step === 'gate_email' && (
        <>
          <label>
            To
            <input
              type="email"
              value={emailDraft.to}
              onChange={(e) =>
                setEmailDraft({ ...emailDraft, to: e.target.value })
              }
            />
          </label>
          <label>
            Subject
            <input
              type="text"
              value={emailDraft.subject}
              onChange={(e) =>
                setEmailDraft({ ...emailDraft, subject: e.target.value })
              }
            />
          </label>
          <textarea
            style={textarea}
            value={emailDraft.body}
            onChange={(e) =>
              setEmailDraft({ ...emailDraft, body: e.target.value })
            }
          />
        </>
      )}

      <div style={buttonRow}>
        <button onClick={onApprove} disabled={submitting}>
          Approve
        </button>
        {canEdit && (
          <button onClick={onEdit} disabled={submitting}>
            Edit and Resume
          </button>
        )}
        <button onClick={onReject} disabled={submitting}>
          Reject
        </button>
      </div>
    </div>
  )
}
