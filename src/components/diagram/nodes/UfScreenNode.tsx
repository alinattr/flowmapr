import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel, type TextAlign } from './EditableLabel'
import { NodeAlignToolbar } from './NodeAlignToolbar'

export function UfScreenNode({ id, data, selected }: NodeProps) {
  const { label, textAlign = 'center' } = data as { label: string; textAlign?: TextAlign }

  return (
    <div
      className="min-w-[140px] rounded-[8px] px-4 py-3 text-sm"
      style={{
        backgroundColor: 'var(--color-accent-subtle)',
        border: selected
          ? '2px solid var(--color-diagram-selected)'
          : '1.5px solid var(--color-accent-brand)',
      }}
    >
      {selected && <NodeAlignToolbar nodeId={id} currentAlign={textAlign} />}
      <Handle type="target" position={Position.Left} />
      <EditableLabel nodeId={id} label={label} textAlign={textAlign} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
