'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function C4ContainerNode({ data, id }: NodeProps) {
  const isExternal = data.isExternal === true || data.external === true
  const theme = isExternal
    ? { bg: '#999999', border: '#6b6b6b', header: '#7f7f7f', text: '#FFFFFF', sub: 'rgba(255,255,255,0.85)' }
    : { bg: '#1168BD', border: '#0e5ca8', header: '#0e5ca8', text: '#FFFFFF', sub: 'rgba(255,255,255,0.88)' }

  return (
    <div style={{
      padding: 0, borderRadius: 10, overflow: 'hidden',
      border: `2px solid ${theme.border}`,
      background: theme.bg,
      minWidth: 140,
    }}>
      <div style={{
        padding: '8px 14px',
        background: theme.header,
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <EditableLabel nodeId={id} label={String(data.label ?? 'Container')}
          style={{ fontSize: 12, fontWeight: 700, color: theme.text, textAlign: 'center' }}
        />
      </div>
      {!!data.technology && (
        <div className="c4-node-type" style={{ padding: '4px 14px 6px', fontFamily: 'Inter, sans-serif', textAlign: 'center', fontStyle: 'italic', color: theme.sub }}>
          [{String(data.technology)}]
        </div>
      )}
      {!!data.description && (
        <div className="c4-node-desc" style={{ padding: '0 14px 8px', fontFamily: 'Inter, sans-serif', textAlign: 'center', color: theme.sub }}>
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
