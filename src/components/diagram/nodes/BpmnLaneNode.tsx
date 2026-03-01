import { type NodeProps } from '@xyflow/react'

export function BpmnLaneNode({ data }: NodeProps) {
  const { label } = data as { label: string }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
        display: 'flex',
        borderBottom: '1px solid var(--color-bpmn-pool-border)',
      }}
    >
      <div
        style={{
          width: 32,
          minWidth: 32,
          height: '100%',
          backgroundColor: 'var(--color-bpmn-lane-label-bg)',
          borderRight: '1px solid var(--color-bpmn-pool-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          className="select-none whitespace-nowrap font-semibold"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 11,
            letterSpacing: '0.03em',
            color: 'var(--color-bpmn-lane-label-text)',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
