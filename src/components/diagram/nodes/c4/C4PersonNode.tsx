'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function C4PersonNode({ data, id }: NodeProps) {
  const isExternal = data.external === true

  return (
    <div
      className={isExternal ? 'c4-external-node' : 'c4-person-node'}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: 8, minWidth: 90 }}
    >
      <div
        className="c4-person-icon"
        style={{
          width: 40, height: 40, borderRadius: '50%',
          background: isExternal ? 'rgba(100,116,139,0.2)' : 'rgba(99,102,241,0.18)',
          border: `2px solid ${isExternal ? 'rgba(100,116,139,0.5)' : 'rgba(99,102,241,0.5)'}`,
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
          style={{ fontSize: 11, fontWeight: 600, textAlign: 'center' }}
        />
      </div>
      {!!data.description && (
        <div className="c4-node-desc" style={{ textAlign: 'center', maxWidth: 120, fontStyle: 'italic', fontFamily: 'Inter, sans-serif' }}>
          {String(data.description)}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: isExternal ? '#64748B' : '#6366F1' }} />
      <Handle type="target" position={Position.Top} style={{ background: isExternal ? '#64748B' : '#6366F1' }} />
      <Handle type="source" position={Position.Right} style={{ background: isExternal ? '#64748B' : '#6366F1' }} />
      <Handle type="target" position={Position.Left} style={{ background: isExternal ? '#64748B' : '#6366F1' }} />
    </div>
  )
}
