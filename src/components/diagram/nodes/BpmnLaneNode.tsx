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
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          width: 32,
          minWidth: 32,
          height: '100%',
          backgroundColor: '#F8F8FA',
          borderRight: '1px solid var(--color-border)',
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
            color: 'var(--color-text-secondary)',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
