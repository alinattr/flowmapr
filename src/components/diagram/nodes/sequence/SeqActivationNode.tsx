import { Handle, Position, type NodeProps } from '@xyflow/react'

export function SeqActivationNode({ data }: NodeProps) {
  const h = typeof data.height === 'number' ? data.height : 60

  return (
    <div className="uml-activation" style={{ width: 12, height: h, borderRadius: 2, position: 'relative' }}>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}
