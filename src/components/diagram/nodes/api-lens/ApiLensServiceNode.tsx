'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { EditableLabel } from '../EditableLabel'

const COLORS: Record<string, string> = {
  service: '#6366F1',
  database: '#3B82F6',
  queue: '#F59E0B',
  cache: '#22C55E',
  external: '#64748B',
  gateway: '#A78BFA',
}

const ICONS: Record<string, string> = {
  service: '⚙',
  database: '🗄',
  queue: '📨',
  cache: '⚡',
  external: '🌐',
  gateway: '🔀',
}

export function ApiLensServiceNode({ data, id }: NodeProps) {
  const kind = String(data.kind ?? 'service')
  const color = COLORS[kind] ?? '#6366F1'
  const icon = ICONS[kind] ?? '⚙'

  return (
    <div style={{
      borderRadius: 10, overflow: 'hidden', minWidth: 140,
      border: `1.5px solid ${color}50`,
      background: 'var(--color-bg-secondary, rgba(9,9,11,0.9))',
      boxShadow: `0 4px 16px ${color}15`,
    }}>
      <div style={{
        padding: '8px 14px', background: `${color}18`,
        borderBottom: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span style={{ fontSize: 14 }}>{icon}</span>
        <EditableLabel nodeId={id} label={String(data.label ?? 'Service')}
          style={{ fontSize: 12, fontWeight: 700, color }}
        />
      </div>
      {!!data.technology && (
        <div style={{ padding: '4px 14px 6px', fontSize: 10, color: '#71717A', fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
          {String(data.technology)}
        </div>
      )}
      {Array.isArray(data.endpoints) && (data.endpoints as string[]).length > 0 && (
        <div style={{ padding: '4px 14px 8px' }}>
          {(data.endpoints as string[]).slice(0, 3).map((ep, i) => (
            <div key={i} style={{ fontSize: 9, color: '#52525B', fontFamily: 'JetBrains Mono, monospace', marginBottom: 2 }}>
              {ep}
            </div>
          ))}
          {(data.endpoints as string[]).length > 3 && (
            <div style={{ fontSize: 9, color: '#3F3F46', fontFamily: 'Inter, sans-serif' }}>
              +{(data.endpoints as string[]).length - 3} more
            </div>
          )}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <Handle type="source" position={Position.Right} style={{ background: color }} />
      <Handle type="target" position={Position.Left} style={{ background: color }} />
    </div>
  )
}
