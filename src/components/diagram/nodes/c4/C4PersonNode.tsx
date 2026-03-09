'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function C4PersonNode({ data, id }: NodeProps) {
  const theme = { bg: '#08427B', border: '#062f58', text: '#FFFFFF', sub: 'rgba(255,255,255,0.85)' }

  return (
    <div
      className="c4-person-node"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 8, minWidth: 90, borderRadius: 8, background: theme.bg, border: `2px solid ${theme.border}` }}
    >
      <div
        className="c4-person-icon"
        style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(255,255,255,0.14)',
          border: '2px solid rgba(255,255,255,0.45)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}
      >
        👤
      </div>
      <div className="c4-node-title">
        <EditableLabel
          nodeId={id}
          label={String(data.label ?? 'Person')}
          style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', color: theme.text }}
        />
      </div>
      {!!data.description && (
        <div className="c4-node-desc" style={{ textAlign: 'center', maxWidth: 120, fontStyle: 'italic', fontFamily: 'Inter, sans-serif', color: theme.sub }}>
          {String(data.description)}
        </div>
      )}
      {[20, 35, 50, 65, 80].map((left, i) => (
        <Handle key={`sb-${i}`} id={`source-bottom-${i + 1}`} type="source" position={Position.Bottom}
          style={{ left: `${left}%`, background: theme.text, width: 8, height: 8 }} />
      ))}
      <Handle id="target-top" type="target" position={Position.Top} style={{ background: theme.text }} />
      <Handle id="source-right" type="source" position={Position.Right} style={{ background: theme.text }} />
      <Handle id="target-left" type="target" position={Position.Left} style={{ background: theme.text }} />
    </div>
  )
}
