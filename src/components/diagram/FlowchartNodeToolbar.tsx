'use client'
import { useReactFlow } from '@xyflow/react'
import { useCallback } from 'react'

type FcNodeType = 'fcProcess' | 'fcDecision' | 'fcData' | 'fcSubprocess'

const NODE_TYPES: { type: FcNodeType; label: string; color: string }[] = [
  { type: 'fcProcess', label: 'Process', color: '#6366F1' },
  { type: 'fcDecision', label: 'Decision', color: '#3B82F6' },
  { type: 'fcData', label: 'Data', color: '#EAB308' },
  { type: 'fcSubprocess', label: 'Subprocess', color: '#8B5CF6' },
]

export function FlowchartNodeToolbar() {
  const { addNodes, getNodes } = useReactFlow()

  const addNode = useCallback((type: FcNodeType, label: string) => {
    const nodes = getNodes()
    const maxY = nodes.length > 0 ? Math.max(...nodes.map(n => n.position.y)) : 0
    addNodes({
      id: `${type}-${Date.now()}`,
      type,
      position: { x: 200, y: maxY + 100 },
      data: { label },
    })
  }, [addNodes, getNodes])

  return (
    <div style={{
      display: 'flex', gap: 6, padding: '6px 12px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 8, flexWrap: 'wrap',
    }}>
      {NODE_TYPES.map(({ type, label, color }) => (
        <button
          key={type}
          onClick={() => addNode(type, label)}
          style={{
            padding: '4px 12px', borderRadius: 6, cursor: 'pointer',
            background: `${color}15`, border: `1px solid ${color}40`,
            color, fontSize: 12, fontFamily: 'Inter, sans-serif',
            fontWeight: 500, transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${color}25` }}
          onMouseLeave={e => { e.currentTarget.style.background = `${color}15` }}
        >
          + {label}
        </button>
      ))}
    </div>
  )
}
