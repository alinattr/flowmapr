import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel, type TextAlign } from './EditableLabel'
import { NodeAlignToolbar } from './NodeAlignToolbar'

type GatewayType = 'xor' | 'parallel'

const handleStyle = {
  width: 6,
  height: 6,
  background: 'var(--color-bpmn-gateway-border)',
  border: 'none',
  opacity: 0,
}

export function BpmnGatewayNode({ id, data, selected }: NodeProps) {
  const {
    label,
    textAlign = 'center',
    gatewayType = 'xor',
  } = data as { label: string; textAlign?: TextAlign; gatewayType?: GatewayType }

  return (
    <div className="relative flex flex-col items-center">
      {selected && <NodeAlignToolbar nodeId={id} currentAlign={textAlign} />}

      <div className="relative flex h-[52px] w-[52px] items-center justify-center">
        <div
          className="absolute h-full w-full rotate-45"
          style={{
            backgroundColor: 'var(--color-bpmn-gateway)',
            border: selected
              ? '2.5px solid var(--color-diagram-selected)'
              : '1.5px solid var(--color-bpmn-gateway-border)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          }}
        />
        <span className="relative z-10 text-lg font-bold select-none" style={{ color: 'var(--color-bpmn-gateway-text)' }}>
          {gatewayType === 'parallel' ? '+' : '\u00D7'}
        </span>

        <Handle type="target" position={Position.Left} id="left" className="z-10" style={handleStyle} />
        <Handle type="target" position={Position.Top} id="top" className="z-10" style={handleStyle} />
        <Handle type="source" position={Position.Right} id="right" className="z-10" style={handleStyle} />
        <Handle type="source" position={Position.Bottom} id="bottom" className="z-10" style={handleStyle} />
      </div>

      {label && (
        <div className="mt-1 max-w-[120px]">
          <EditableLabel
            nodeId={id}
            label={label}
            textAlign={textAlign}
            className="text-[11px] leading-tight text-[var(--color-text-secondary)]"
          />
        </div>
      )}
    </div>
  )
}
