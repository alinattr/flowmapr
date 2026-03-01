'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function C4BoundaryNode({ data, id }: NodeProps) {
  const w = typeof data.width === 'number' ? data.width : 400
  const h = typeof data.height === 'number' ? data.height : 300

  return (
    <div
      className="c4-boundary-node"
      style={{ width: w, height: h, position: 'relative' }}
    >
      <div style={{
        position: 'absolute', top: -12, left: 14,
        background: 'var(--color-diagram-bg, var(--color-bg-primary))',
        padding: '0 8px',
      }}>
        <div className="c4-boundary-label">
          <EditableLabel
            nodeId={id}
            label={String(data.label ?? 'Boundary')}
            style={{ fontSize: 11, fontStyle: 'italic' }}
          />
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
    </div>
  )
}
