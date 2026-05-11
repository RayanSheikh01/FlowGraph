import { useEffect, useState } from 'react'
import { useGraphStore } from '../store'
import type { EmailDraft, HitlDecision, ResumePatch } from '../types'

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

  useEffect(() => {
    if (!interrupt) {
      setSubmitting(false)
      return
    }
    const fs = useGraphStore.getState().flowState
    if (interrupt.step === 'gate_summarize') {
      const preview =
        typeof interrupt.preview === 'string' ? interrupt.preview : null
      setSummaryDraft(preview ?? fs?.summary ?? '')
    } else if (interrupt.step === 'gate_email') {
      const preview = isEmailDraft(interrupt.preview) ? interrupt.preview : null
      setEmailDraft(preview ?? fs?.email_draft ?? EMPTY_EMAIL)
    }
    setSubmitting(false)
  }, [interrupt])

  if (error) {
    return (
      <div className="hitl hitl--error" key="error">
        <h3 className="hitl__title">Flow error</h3>
        <p className="hitl__body">{error.message}</p>
        {error.node && (
          <p className="hitl__meta">Failing node: {error.node}</p>
        )}
        <div className="hitl__buttons">
          <button
            className="hitl-btn hitl-btn--ghost"
            onClick={() => window.location.reload()}
          >
            Start new flow
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    const wasRejected = !!done.state.error
    const sent = done.state.email_sent === true
    return (
      <div
        className={`hitl ${wasRejected ? 'hitl--error' : 'hitl--success'}`}
        key="done"
      >
        <h3 className="hitl__title">
          {wasRejected ? 'Flow rejected' : 'Flow complete'}
        </h3>
        {wasRejected && <p className="hitl__body">{done.state.error}</p>}
        {sent && (
          <>
            <p className="hitl__body">
              Email sent to {done.state.email_draft?.to ?? ''}
            </p>
            {done.state.message_id && (
              <p className="hitl__meta hitl__meta--mono">
                Message-ID: {done.state.message_id}
              </p>
            )}
          </>
        )}
        <div className="hitl__buttons">
          <button
            className="hitl-btn hitl-btn--ghost"
            onClick={() => window.location.reload()}
          >
            Start new flow
          </button>
        </div>
      </div>
    )
  }

  if (!interrupt) {
    return (
      <div className="hitl hitl--idle" key="idle">
        <h3 className="hitl__title">Awaiting interrupt</h3>
        <p className="hitl__body">
          {flowState ? 'Flow is running…' : 'No flow started yet.'}
        </p>
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
    <div className="hitl hitl--paused" key={interrupt.step}>
      <h3 className="hitl__title">Human intervention required</h3>
      <p className="hitl__body">{interrupt.message}</p>

      {interrupt.step === 'gate_research' && (
        <ul className="hitl__research">
          {(flowState?.research_results ?? []).map((r) => (
            <li key={r.url}>
              <a href={r.url} target="_blank" rel="noreferrer">
                {r.title}
              </a>
              <div className="hitl__snippet">{r.snippet}</div>
            </li>
          ))}
        </ul>
      )}

      {interrupt.step === 'gate_summarize' && (
        <textarea
          className="hitl__textarea"
          value={summaryDraft}
          onChange={(e) => setSummaryDraft(e.target.value)}
        />
      )}

      {interrupt.step === 'gate_email' && (
        <div className="hitl__form">
          <label className="hitl__field">
            <span>To</span>
            <input
              type="email"
              value={emailDraft.to}
              onChange={(e) =>
                setEmailDraft({ ...emailDraft, to: e.target.value })
              }
            />
          </label>
          <label className="hitl__field">
            <span>Subject</span>
            <input
              type="text"
              value={emailDraft.subject}
              onChange={(e) =>
                setEmailDraft({ ...emailDraft, subject: e.target.value })
              }
            />
          </label>
          <label className="hitl__field">
            <span>Body</span>
            <textarea
              className="hitl__textarea"
              value={emailDraft.body}
              onChange={(e) =>
                setEmailDraft({ ...emailDraft, body: e.target.value })
              }
            />
          </label>
        </div>
      )}

      <div className="hitl__buttons">
        <button
          className="hitl-btn hitl-btn--primary"
          onClick={onApprove}
          disabled={submitting}
        >
          Approve
        </button>
        {canEdit && (
          <button
            className="hitl-btn"
            onClick={onEdit}
            disabled={submitting}
          >
            Edit & resume
          </button>
        )}
        <button
          className="hitl-btn hitl-btn--danger"
          onClick={onReject}
          disabled={submitting}
        >
          Reject
        </button>
      </div>
    </div>
  )
}
