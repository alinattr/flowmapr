import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel, type TextAlign } from './EditableLabel'
import { NodeAlignToolbar } from './NodeAlignToolbar'

export function UfActionNode({ id, data, selected }: NodeProps) {
  const { label, textAlign = 'center' } = data as { label: string; textAlign?: TextAlign }

  return (
    <div
      className="min-w-[120px] rounded-[4px] px-4 py-3 text-sm"
      style={{
        backgroundColor: 'var(--color-diagram-node)',
        border: selected
          ? '2px solid var(--color-diagram-selected)'
          : '1.5px solid var(--color-diagram-edge)',
      }}
    >
      {selected && <NodeAlignToolbar nodeId={id} currentAlign={textAlign} />}
      <Handle type="target" position={Position.Left} />
      <EditableLabel nodeId={id} label={label} textAlign={textAlign} />
      <Handle type="source" position={Position.Right} />
    </div>
  )
}
