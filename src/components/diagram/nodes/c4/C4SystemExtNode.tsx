'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function C4SystemExtNode({ data, id }: NodeProps) {
  return (
    <div
      className="c4-external-node"
      style={{ padding: 0, borderRadius: 8, overflow: 'hidden', minWidth: 130 }}
    >
      <div style={{
        padding: '6px 14px',
        background: 'rgba(100,116,139,0.12)',
        borderBottom: '1px solid rgba(100,116,139,0.2)',
      }}>
        <div className="c4-node-title">
          <EditableLabel
            nodeId={id}
            label={String(data.label ?? 'External System')}
            style={{ fontSize: 11, fontWeight: 600, textAlign: 'center' }}
          />
        </div>
      </div>
      {!!data.description && (
        <div className="c4-node-desc" style={{ padding: '4px 10px 8px', fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
          {String(data.description)}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: '#64748B' }} />
      <Handle type="target" position={Position.Top} style={{ background: '#64748B' }} />
      <Handle type="source" position={Position.Right} style={{ background: '#64748B' }} />
      <Handle type="target" position={Position.Left} style={{ background: '#64748B' }} />
    </div>
  )
}
