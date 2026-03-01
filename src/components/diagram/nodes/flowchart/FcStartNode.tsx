import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function FcStartNode({ data, id }: NodeProps) {
  return (
    <div className="fc-node-start" style={{
      padding: '8px 20px', borderRadius: 999,
      minWidth: 90, textAlign: 'center',
    }}>
      <EditableLabel nodeId={id} label={String(data.label ?? 'Start')} />
      <Handle type="source" position={Position.Bottom} style={{ background: '#22C55E' }} />
    </div>
  )
}
