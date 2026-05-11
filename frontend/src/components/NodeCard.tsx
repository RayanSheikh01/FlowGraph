import { memo } from 'react'
import { Handle, Position, type NodeProps } from 'reactflow'
import type { NodeName, NodeStatus } from '../types'

export interface NodeCardData {
  label: string
  nodeName: NodeName
  status: NodeStatus
}

function NodeCard({ data }: NodeProps<NodeCardData>) {
  const { label, status } = data
  return (
    <div className="node-card">
      <Handle type="target" position={Position.Left} />
      <span className="node-card__label">{label}</span>
      <span className={`status-pill status-pill--${status}`}>{status}</span>
      <Handle type="source" position={Position.Right} />
    </div>
  )
}

export default memo(NodeCard)
