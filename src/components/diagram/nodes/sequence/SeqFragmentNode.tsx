'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

const FRAGMENT_COLORS: Record<string, string> = {
  loop: '#F59E0B',
  alt: '#6366F1',
  opt: '#22C55E',
  par: '#3B82F6',
  ref: '#A78BFA',
}

export function SeqFragmentNode({ data, id }: NodeProps) {
  const kind = String(data.kind ?? 'loop')
  const color = FRAGMENT_COLORS[kind] ?? '#6366F1'
  const w = typeof data.width === 'number' ? data.width : 300
  const h = typeof data.height === 'number' ? data.height : 160

  return (
    <div className="uml-fragment" style={{ width: w, height: h, position: 'relative', borderRadius: 6 }}>
      <div style={{
        position: 'absolute', top: 0, left: 0,
        background: `${color}20`, border: `1px solid ${color}40`,
        borderRadius: '5px 0 8px 0', padding: '3px 10px',
        fontSize: 10, fontWeight: 700, fontFamily: 'Inter, sans-serif', color,
      }}>
        {kind}
      </div>
      <div style={{ position: 'absolute', top: 8, left: 56 }}>
        <EditableLabel nodeId={id} label={String(data.label ?? '')}
          style={{ fontSize: 10, color: 'var(--color-text-secondary)' }}
        />
      </div>
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
    </div>
  )
}
