import { Handle, Position, type NodeProps } from '@xyflow/react'

const handleStyle = {
  width: 6,
  height: 6,
  background: 'var(--color-bpmn-start-border)',
  border: 'none',
  opacity: 0,
}

export function BpmnStartEventNode({ selected }: NodeProps) {
  return (
    <div
      className="flex h-[44px] w-[44px] items-center justify-center rounded-full"
      style={{
        backgroundColor: 'var(--color-bpmn-start)',
        border: selected
          ? '3px solid var(--color-diagram-selected)'
          : '2px solid var(--color-bpmn-start-border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />
    </div>
  )
}
