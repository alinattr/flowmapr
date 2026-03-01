import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel, type TextAlign } from './EditableLabel'
import { NodeAlignToolbar } from './NodeAlignToolbar'

const handleStyle = {
  width: 6,
  height: 6,
  background: 'var(--color-bpmn-task-border)',
  border: 'none',
  opacity: 0,
}

export function BpmnTaskNode({ id, data, selected }: NodeProps) {
  const { label, textAlign = 'center' } = data as { label: string; textAlign?: TextAlign }

  return (
    <div
      className="rounded-[8px] text-sm"
      style={{
        width: 160,
        minHeight: 56,
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--color-bpmn-task)',
        border: selected
          ? '2.5px solid var(--color-diagram-selected)'
          : '1.5px solid var(--color-bpmn-task-border)',
        color: 'var(--color-bpmn-task-text)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}
    >
      {selected && <NodeAlignToolbar nodeId={id} currentAlign={textAlign} />}
      <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
      <EditableLabel nodeId={id} label={label} textAlign={textAlign} />
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />
    </div>
  )
}
