import { useState } from 'react'
import { useGraphStore } from '../store'

interface JsonNodeProps {
  name: string
  value: unknown
  depth: number
  defaultOpen?: boolean
}

function JsonNode({ name, value, depth, defaultOpen = false }: JsonNodeProps) {
  const [open, setOpen] = useState(defaultOpen || depth < 1)

  if (value === null) {
    return (
      <div className="json-row" style={{ paddingLeft: depth * 12 }}>
        <span className="json-key">{name}:</span>
        <span className="json-value json-value--null">null</span>
      </div>
    )
  }

  if (typeof value === 'string') {
    return (
      <div className="json-row" style={{ paddingLeft: depth * 12 }}>
        <span className="json-key">{name}:</span>
        <span className="json-value json-value--string">
          "{value.length > 80 ? value.slice(0, 80) + '…' : value}"
        </span>
      </div>
    )
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return (
      <div className="json-row" style={{ paddingLeft: depth * 12 }}>
        <span className="json-key">{name}:</span>
        <span className={`json-value json-value--${typeof value}`}>
          {String(value)}
        </span>
      </div>
    )
  }

  if (Array.isArray(value)) {
    return (
      <div>
        <button
          className="json-toggle"
          style={{ paddingLeft: depth * 12 }}
          onClick={() => setOpen(!open)}
        >
          <span className="json-caret">{open ? '▾' : '▸'}</span>
          <span className="json-key">{name}</span>
          <span className="json-meta">[{value.length}]</span>
        </button>
        {open &&
          value.map((v, i) => (
            <JsonNode key={i} name={String(i)} value={v} depth={depth + 1} />
          ))}
      </div>
    )
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
    return (
      <div>
        <button
          className="json-toggle"
          style={{ paddingLeft: depth * 12 }}
          onClick={() => setOpen(!open)}
        >
          <span className="json-caret">{open ? '▾' : '▸'}</span>
          <span className="json-key">{name}</span>
          <span className="json-meta">{`{${entries.length}}`}</span>
        </button>
        {open &&
          entries.map(([k, v]) => (
            <JsonNode key={k} name={k} value={v} depth={depth + 1} />
          ))}
      </div>
    )
  }

  return null
}

export const StateInspector = () => {
  const flowState = useGraphStore((s) => s.flowState)

  if (!flowState) {
    return (
      <div className="inspector inspector--empty">
        <h3 className="inspector__title">State</h3>
        <p className="inspector__hint">No flow state yet.</p>
      </div>
    )
  }

  return (
    <div className="inspector">
      <h3 className="inspector__title">State</h3>
      <div className="inspector__tree">
        <JsonNode name="flowState" value={flowState} depth={0} defaultOpen />
      </div>
    </div>
  )
}
