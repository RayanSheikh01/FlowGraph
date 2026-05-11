import { create } from 'zustand'
import type {
  DoneMessage,
  ErrorMessage,
  FlowState,
  InterruptMessage,
  NodeName,
  NodeStatus,
} from './types'

export type ConnectionStatus = 'connecting' | 'open' | 'closed' | 'error'

interface GraphStore {
  threadId: string
  connectionStatus: ConnectionStatus
  flowState: FlowState | null
  interrupt: InterruptMessage | null
  done: DoneMessage | null
  error: ErrorMessage | null

  setConnectionStatus: (s: ConnectionStatus) => void
  setState: (state: FlowState) => void
  setNodeStatus: (node: NodeName, status: NodeStatus) => void
  setInterrupt: (msg: InterruptMessage) => void
  clearInterrupt: () => void
  setDone: (msg: DoneMessage) => void
  setError: (msg: ErrorMessage) => void
  clearError: () => void
  reset: () => void
}

export const useGraphStore = create<GraphStore>((set) => ({
  threadId: crypto.randomUUID(),
  connectionStatus: 'connecting',
  flowState: null,
  interrupt: null,
  done: null,
  error: null,

  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),

  setState: (flowState) => set({ flowState }),

  setNodeStatus: (node, status) =>
    set((s) => {
      if (!s.flowState) return s
      return {
        flowState: {
          ...s.flowState,
          node_status: { ...s.flowState.node_status, [node]: status },
        },
      }
    }),

  setInterrupt: (interrupt) => set({ interrupt }),
  clearInterrupt: () => set({ interrupt: null }),
  setDone: (done) => set({ done }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  reset: () =>
    set({
      threadId: crypto.randomUUID(),
      flowState: null,
      interrupt: null,
      done: null,
      error: null,
    }),
}))

