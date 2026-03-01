import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function FcEndNode({ data, id }: NodeProps) {
  return (
    <div className="fc-node-end" style={{
      padding: '8px 20px', borderRadius: 999,
      minWidth: 90, textAlign: 'center',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#EF4444' }} />
      <EditableLabel nodeId={id} label={String(data.label ?? 'End')} />
    </div>
  )
}
