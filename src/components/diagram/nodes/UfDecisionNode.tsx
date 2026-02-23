import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel, type TextAlign } from './EditableLabel'
import { NodeAlignToolbar } from './NodeAlignToolbar'

export function UfDecisionNode({ id, data, selected }: NodeProps) {
  const { label, textAlign = 'center' } = data as { label: string; textAlign?: TextAlign }

  return (
    <div className="relative flex h-16 w-16 items-center justify-center">
      {selected && <NodeAlignToolbar nodeId={id} currentAlign={textAlign} />}
      <div
        className="absolute h-full w-full rotate-45"
        style={{
          backgroundColor: '#FEF9C3',
          border: selected
            ? '2px solid var(--color-diagram-selected)'
            : '1.5px solid var(--color-warning)',
        }}
      />
      <EditableLabel
        nodeId={id}
        label={label}
        textAlign={textAlign}
        className="relative z-10 text-xs font-medium"
      />
      <Handle type="target" position={Position.Left} className="z-10" />
      <Handle type="source" position={Position.Right} className="z-10" />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="z-10"
      />
    </div>
  )
}
