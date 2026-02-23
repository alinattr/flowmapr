import { Handle, Position, type NodeProps } from '@xyflow/react'

const handleStyle = {
  width: 6,
  height: 6,
  background: 'var(--color-bpmn-end-border)',
  border: 'none',
  opacity: 0,
}

export function BpmnEndEventNode({ selected }: NodeProps) {
  return (
    <div
      className="flex h-[44px] w-[44px] items-center justify-center rounded-full"
      style={{
        backgroundColor: 'var(--color-bpmn-end)',
        border: selected
          ? '3px solid var(--color-diagram-selected)'
          : '3px solid var(--color-bpmn-end-border)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
      }}
    >
      <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
    </div>
  )
}
