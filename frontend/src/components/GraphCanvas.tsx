import { useMemo } from 'react'
import ReactFlow, { Background, Controls, type Edge, type Node } from 'reactflow'
import 'reactflow/dist/style.css'

import { useGraphStore } from '../store'
import type { NodeName, NodeStatus } from '../types'
import NodeCard, { type NodeCardData } from './NodeCard'

const NODE_LAYOUT: { id: NodeName; label: string; x: number }[] = [
  { id: 'research', label: 'Research', x: 0 },
  { id: 'summarize', label: 'Summarize', x: 240 },
  { id: 'draft_email', label: 'Draft Email', x: 480 },
  { id: 'send_email', label: 'Send Email', x: 720 },
]

const EDGES: Edge[] = [
  { id: 'e1', source: 'research', target: 'summarize' },
  { id: 'e2', source: 'summarize', target: 'draft_email' },
  { id: 'e3', source: 'draft_email', target: 'send_email' },
]

const nodeTypes = { flowNode: NodeCard }

function GraphCanvas() {
  const nodeStatus = useGraphStore(
    (s) => s.flowState?.node_status,
  ) as Partial<Record<NodeName, NodeStatus>> | undefined

  const nodes: Node<NodeCardData>[] = useMemo(
    () =>
      NODE_LAYOUT.map(({ id, label, x }) => ({
        id,
        type: 'flowNode',
        position: { x, y: 0 },
        data: {
          label,
          nodeName: id,
          status: nodeStatus?.[id] ?? 'idle',
        },
      })),
    [nodeStatus],
  )

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow nodes={nodes} edges={EDGES} nodeTypes={nodeTypes} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export default GraphCanvas
