export type NodeName = 'research' | 'summarize' | 'draft_email' | 'send_email'

export type NodeStatus = 'idle' | 'running' | 'paused' | 'complete' | 'error'

export type InterruptStep = 'approve_research' | 'approve_summary' | 'approve_draft'

export type HitlDecision = 'approve' | 'edit' | 'reject'

export interface ResearchResult {
  title: string
  url: string
  snippet: string
}

export interface EmailDraft {
  to: string
  subject: string
  body: string
}

export interface FlowState {
  topic: string
  research_results: ResearchResult[]
  summary: string
  email_draft: EmailDraft
  email_sent: boolean
  node_status: Partial<Record<NodeName, NodeStatus>>
  error: string | null
}

export interface StateUpdateMessage {
  type: 'state_update'
  state: FlowState
}

export interface NodeStatusMessage {
  type: 'node_status'
  node: NodeName
  status: NodeStatus
}

export interface InterruptMessage {
  type: 'interrupt'
  step: InterruptStep
  preview: Partial<FlowState>
}

export interface DoneMessage {
  type: 'done'
  email_sent: boolean
  message_id: string
}

export interface ErrorMessage {
  type: 'error'
  message: string
  node: NodeName | null
}

export type WsMessage =
  | StateUpdateMessage
  | NodeStatusMessage
  | InterruptMessage
  | DoneMessage
  | ErrorMessage

export interface StartCommand {
  type: 'start'
  topic: string
  recipient_email: string
}

export interface ResumePatch {
  summary?: string
  email_draft?: Partial<EmailDraft>
}

export interface ResumeCommand {
  type: 'resume'
  decision: HitlDecision
  patch?: ResumePatch
}

export type ClientMessage = StartCommand | ResumeCommand
