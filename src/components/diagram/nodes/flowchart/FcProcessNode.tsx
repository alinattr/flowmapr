import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function FcProcessNode({ data, id }: NodeProps) {
  return (
    <div className="fc-node-process" style={{
      padding: '10px 16px', borderRadius: 8,
      minWidth: 120, textAlign: 'center',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#6366F1' }} />
      <EditableLabel nodeId={id} label={String(data.label ?? 'Process')} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#6366F1' }} />
    </div>
  )
}
