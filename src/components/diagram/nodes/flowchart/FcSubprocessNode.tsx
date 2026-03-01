import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function FcSubprocessNode({ data, id }: NodeProps) {
  return (
    <div className="fc-node-subprocess" style={{
      padding: '10px 16px', borderRadius: 8,
      minWidth: 130, textAlign: 'center',
      position: 'relative',
    }}>
      <Handle type="target" position={Position.Top} style={{ background: '#8B5CF6' }} />
      <EditableLabel nodeId={id} label={String(data.label ?? 'Subprocess')} />
      <div style={{
        position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
        width: 14, height: 14, border: '1px solid currentColor',
        borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, opacity: 0.6, lineHeight: 1,
      }}>+</div>
      <Handle type="source" position={Position.Bottom} style={{ background: '#8B5CF6' }} />
    </div>
  )
}
