import type { InterruptStep, NodeName, NodeStatus } from './types'

const STEP_TO_NODE: Record<InterruptStep, NodeName> = {
  gate_research: 'research',
  gate_summarize: 'summarize',
  gate_email: 'draft_email',
}

export function normalizeStatus(
  raw: string | undefined,
  ctx: { id: NodeName; interruptStep: InterruptStep | null },
): NodeStatus {
  if (ctx.interruptStep && STEP_TO_NODE[ctx.interruptStep] === ctx.id) {
    return 'paused'
  }
  switch (raw) {
    case 'running':
      return 'running'
    case 'completed':
    case 'complete':
    case 'approved':
      return 'complete'
    case 'failed':
    case 'error':
    case 'rejected':
      return 'error'
    case 'paused':
      return 'paused'
    default:
      return 'idle'
  }
}
