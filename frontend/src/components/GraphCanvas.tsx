import { useMemo } from 'react'
import ReactFlow, { Background, Controls, type Edge, type Node } from 'reactflow'
import 'reactflow/dist/style.css'

import { useGraphStore } from '../store'
import { normalizeStatus } from '../status'
import type { NodeName, NodeStatus } from '../types'
import NodeCard, { type NodeCardData } from './NodeCard'

const NODE_LAYOUT: { id: NodeName; label: string; x: number }[] = [
  { id: 'research', label: 'Research', x: 0 },
  { id: 'summarize', label: 'Summarize', x: 240 },
  { id: 'draft_email', label: 'Draft Email', x: 480 },
  { id: 'send_email', label: 'Send Email', x: 720 },
]

const BASE_EDGES: { id: string; source: NodeName; target: NodeName }[] = [
  { id: 'e1', source: 'research', target: 'summarize' },
  { id: 'e2', source: 'summarize', target: 'draft_email' },
  { id: 'e3', source: 'draft_email', target: 'send_email' },
]

const nodeTypes = { flowNode: NodeCard }

function GraphCanvas() {
  const nodeStatus = useGraphStore(
    (s) => s.flowState?.node_status,
  ) as Partial<Record<NodeName, string>> | undefined
  const interruptStep = useGraphStore((s) => s.interrupt?.step ?? null)

  const normalized = useMemo<Partial<Record<NodeName, NodeStatus>>>(() => {
    const map: Partial<Record<NodeName, NodeStatus>> = {}
    NODE_LAYOUT.forEach(({ id }) => {
      map[id] = normalizeStatus(nodeStatus?.[id], { id, interruptStep })
    })
    return map
  }, [nodeStatus, interruptStep])

  const nodes: Node<NodeCardData>[] = useMemo(
    () =>
      NODE_LAYOUT.map(({ id, label, x }) => ({
        id,
        type: 'flowNode',
        position: { x, y: 0 },
        data: {
          label,
          nodeName: id,
          status: normalized[id] ?? 'idle',
        },
      })),
    [normalized],
  )

  const edges: Edge[] = useMemo(
    () =>
      BASE_EDGES.map((e) => {
        const sourceStatus = normalized[e.source]
        const targetStatus = normalized[e.target]
        const active =
          sourceStatus === 'running' ||
          sourceStatus === 'paused' ||
          targetStatus === 'running'
        const complete = sourceStatus === 'complete' && targetStatus !== 'idle'
        return {
          ...e,
          animated: active,
          style: {
            stroke: complete ? '#22c55e' : active ? '#3b82f6' : '#9ca3af',
            strokeWidth: active || complete ? 2 : 1,
            transition: 'stroke 200ms ease, stroke-width 200ms ease',
          },
        }
      }),
    [normalized],
  )

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export default GraphCanvas
