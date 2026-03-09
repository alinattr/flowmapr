'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function C4SystemExtNode({ data, id }: NodeProps) {
  const theme = { bg: '#999999', border: '#6b6b6b', header: '#7f7f7f', text: '#FFFFFF', sub: 'rgba(255,255,255,0.85)' }
  return (
    <div
      className="c4-external-node"
      style={{ padding: 0, borderRadius: 8, overflow: 'hidden', minWidth: 130, background: theme.bg, border: `2px solid ${theme.border}` }}
    >
      <div style={{
        padding: '6px 14px',
        background: theme.header,
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <div className="c4-node-title">
          <EditableLabel
            nodeId={id}
            label={String(data.label ?? 'External System')}
            style={{ fontSize: 11, fontWeight: 600, textAlign: 'center', color: theme.text }}
          />
        </div>
      </div>
      {!!data.description && (
        <div className="c4-node-desc" style={{ padding: '4px 10px 8px', fontFamily: 'Inter, sans-serif', textAlign: 'center', color: theme.sub }}>
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
