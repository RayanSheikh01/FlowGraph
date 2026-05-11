import { useCallback, useEffect, useRef } from 'react'
import { useGraphStore } from '../store'
import type {
  ClientMessage,
  HitlDecision,
  ResumePatch,
  WsMessage,
} from '../types'

const WS_BASE =
  (import.meta.env.VITE_WS_URL as string | undefined) ?? 'ws://localhost:8000'

const MAX_BACKOFF_MS = 10_000

function detach(ws: WebSocket) {
  ws.onopen = null
  ws.onmessage = null
  ws.onerror = null
  ws.onclose = null
}

export function useGraphSocket() {
  const threadId = useGraphStore((s) => s.threadId)
  const setConnectionStatus = useGraphStore((s) => s.setConnectionStatus)
  const setState = useGraphStore((s) => s.setState)
  const setNodeStatus = useGraphStore((s) => s.setNodeStatus)
  const setInterrupt = useGraphStore((s) => s.setInterrupt)
  const setDone = useGraphStore((s) => s.setDone)
  const setError = useGraphStore((s) => s.setError)

  const wsRef = useRef<WebSocket | null>(null)
  const backoffRef = useRef(1000)
  const reconnectTimerRef = useRef<number | null>(null)
  const closedByDoneRef = useRef(false)

  const connect = useCallback(() => {
    setConnectionStatus('connecting')
    const ws = new WebSocket(`${WS_BASE}/ws/${threadId}`)
    wsRef.current = ws

    ws.onopen = () => {
      if (wsRef.current !== ws) return
      backoffRef.current = 1000
      setConnectionStatus('open')
    }

    ws.onmessage = (ev) => {
      if (wsRef.current !== ws) return
      let msg: WsMessage
      try {
        msg = JSON.parse(ev.data) as WsMessage
      } catch {
        return
      }
      switch (msg.type) {
        case 'state_update':
          setState(msg.state)
          break
        case 'node_status':
          setNodeStatus(msg.node, msg.status)
          break
        case 'interrupt':
          setInterrupt(msg)
          break
        case 'done':
          closedByDoneRef.current = true
          setDone(msg)
          break
        case 'error':
          setError(msg)
          break
      }
    }

    ws.onerror = () => {
      if (wsRef.current !== ws) return
      setConnectionStatus('error')
    }

    ws.onclose = () => {
      if (wsRef.current !== ws) return
      setConnectionStatus('closed')
      if (closedByDoneRef.current) return
      const delay = backoffRef.current
      backoffRef.current = Math.min(delay * 2, MAX_BACKOFF_MS)
      reconnectTimerRef.current = window.setTimeout(connect, delay)
    }
  }, [
    threadId,
    setConnectionStatus,
    setState,
    setNodeStatus,
    setInterrupt,
    setDone,
    setError,
  ])

  useEffect(() => {
    closedByDoneRef.current = false
    connect()
    return () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current)
        reconnectTimerRef.current = null
      }
      const ws = wsRef.current
      wsRef.current = null
      if (ws) {
        detach(ws)
        if (ws.readyState <= WebSocket.OPEN) ws.close()
      }
    }
  }, [connect])

  const send = useCallback((msg: ClientMessage) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(msg))
    return true
  }, [])

  const start = useCallback(
    (topic: string, recipient_email: string) =>
      send({ type: 'start', topic, recipient_email }),
    [send],
  )

  const resume = useCallback(
    (decision: HitlDecision, patch?: ResumePatch) =>
      send({ type: 'resume', decision, patch }),
    [send],
  )

  return { start, resume }
}
