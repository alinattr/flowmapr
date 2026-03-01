'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function SeqMessageNode({ data, id }: NodeProps) {
  const isReturn = data.isReturn === true
  const lineColor = isReturn ? 'rgba(167,139,250,0.7)' : 'rgba(99,102,241,0.8)'

  return (
    <div style={{ position: 'relative', minWidth: 80, textAlign: 'center', padding: '4px 8px' }}>
      <div style={{
        position: 'absolute', top: '50%', left: 0, right: 0, height: 1,
        background: lineColor, transform: 'translateY(-50%)',
        borderTop: isReturn ? '1px dashed rgba(167,139,250,0.6)' : 'none',
      }} />
      <div className="uml-message-label" style={{
        position: 'relative', zIndex: 1, display: 'inline-block',
      }}>
        <EditableLabel nodeId={id} label={String(data.label ?? 'message()')} />
      </div>
      <Handle type="target" position={Position.Left} id="left" style={{ opacity: 0, left: 0 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ opacity: 0, right: 0 }} />
    </div>
  )
}
