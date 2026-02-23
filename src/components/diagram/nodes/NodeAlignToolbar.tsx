'use client'

import { NodeToolbar, Position, useReactFlow } from '@xyflow/react'
import { AlignLeft, AlignCenter, AlignRight } from 'lucide-react'
import type { TextAlign } from './EditableLabel'

interface NodeAlignToolbarProps {
  nodeId: string
  currentAlign: TextAlign
}

export function NodeAlignToolbar({ nodeId, currentAlign }: NodeAlignToolbarProps) {
  const { setNodes } = useReactFlow()

  function setAlign(align: TextAlign) {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === nodeId ? { ...n, data: { ...n.data, textAlign: align } } : n
      )
    )
  }

  const options: { value: TextAlign; icon: typeof AlignLeft }[] = [
    { value: 'left', icon: AlignLeft },
    { value: 'center', icon: AlignCenter },
    { value: 'right', icon: AlignRight },
  ]

  return (
    <NodeToolbar position={Position.Top} offset={8}>
      <div className="flex items-center gap-0.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-0.5 shadow-md">
        {options.map(({ value, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setAlign(value)}
            className={`rounded-md p-1.5 transition-colors ${
              currentAlign === value
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent-brand)]'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        ))}
      </div>
    </NodeToolbar>
  )
}
