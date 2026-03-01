import { type NodeProps } from '@xyflow/react'

export function BpmnPoolNode({ data }: NodeProps) {
  const { label } = data as { label: string }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none',
        border: '1.5px solid var(--color-bpmn-pool-border)',
        borderRadius: 4,
        backgroundColor: 'var(--color-bpmn-pool-bg)',
        display: 'flex',
        position: 'relative',
      }}
    >
      {/* Left label bar */}
      <div
        style={{
          width: 36,
          minWidth: 36,
          height: '100%',
          backgroundColor: 'var(--color-bpmn-pool-bar)',
          borderRight: '1px solid var(--color-bpmn-pool-border)',
          borderRadius: '3px 0 0 3px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}
      >
        <span
          className="select-none whitespace-nowrap font-bold"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 12,
            letterSpacing: '0.04em',
            color: 'var(--color-bpmn-pool-bar-text)',
          }}
        >
          {label}
        </span>
      </div>

      {/* Top title bar */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 36,
          right: 0,
          height: 32,
          borderBottom: '1px solid var(--color-bpmn-pool-border)',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 12,
          backgroundColor: 'var(--color-bpmn-pool-title-bg)',
          borderRadius: '0 3px 0 0',
          pointerEvents: 'none',
        }}
      >
        <span
          className="select-none font-semibold"
          style={{
            fontSize: 12,
            color: 'var(--color-text-primary)',
            fontFamily: 'Inter',
          }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
