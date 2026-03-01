'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function C4ContainerNode({ data, id }: NodeProps) {
  const color = String(data.color ?? '#6366F1')

  return (
    <div style={{
      padding: 0, borderRadius: 10, overflow: 'hidden',
      border: `1.5px solid ${color}50`,
      background: 'var(--color-bg-secondary, rgba(255,255,255,0.03))',
      minWidth: 140, boxShadow: `0 4px 20px ${color}10`,
    }}>
      <div style={{
        padding: '8px 14px', background: `${color}20`,
        borderBottom: `1px solid ${color}30`,
      }}>
        <EditableLabel nodeId={id} label={String(data.label ?? 'Container')}
          style={{ fontSize: 12, fontWeight: 700, color, textAlign: 'center' }}
        />
      </div>
      {!!data.technology && (
        <div className="c4-node-type" style={{ padding: '4px 14px 6px', fontFamily: 'Inter, sans-serif', textAlign: 'center', fontStyle: 'italic', color: 'var(--color-text-tertiary)' }}>
          [{String(data.technology)}]
        </div>
      )}
      {!!data.description && (
        <div className="c4-node-desc" style={{ padding: '0 14px 8px', fontFamily: 'Inter, sans-serif', textAlign: 'center', color: 'var(--color-text-secondary)' }}>
          {String(data.description)}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <Handle type="source" position={Position.Right} style={{ background: color }} />
      <Handle type="target" position={Position.Left} style={{ background: color }} />
    </div>
  )
}
