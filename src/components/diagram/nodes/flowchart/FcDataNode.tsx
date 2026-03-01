import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

export function FcDataNode({ data, id }: NodeProps) {
  return (
    <div style={{ position: 'relative', width: 130, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="130" height="48" style={{ position: 'absolute', top: 0, left: 0 }}>
        <polygon
          className="fc-data-shape"
          points="20,4 126,4 110,44 4,44"
        />
      </svg>
      <Handle type="target" position={Position.Top} style={{ top: 4, background: '#EAB308', zIndex: 1 }} />
      <EditableLabel nodeId={id} label={String(data.label ?? 'Data')} style={{ position: 'relative', zIndex: 1, fontSize: 11, textAlign: 'center', maxWidth: 90 }} />
      <Handle type="source" position={Position.Bottom} style={{ bottom: 4, background: '#EAB308', zIndex: 1 }} />
    </div>
  )
}
