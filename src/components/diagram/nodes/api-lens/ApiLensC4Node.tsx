'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'

type C4Variant = 'person' | 'internal' | 'external'

export function ApiLensC4Node({ data }: NodeProps) {
  const variant = (data.variant as C4Variant) ?? 'internal'
  const label = String(data.label ?? '')
  const stereotype = String(data.stereotype ?? 'Software System')
  const description = String(data.description ?? '')

  const handleStyle = { width: 7, height: 7, border: 'none', opacity: 0 }

  if (variant === 'person') {
    return (
      <div style={{
        width: 160, padding: '14px 12px 12px',
        background: 'rgba(99,102,241,0.15)',
        border: '1.5px solid rgba(99,102,241,0.5)',
        borderRadius: 8, textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <Handle type="target" position={Position.Top} style={handleStyle} />
        <Handle type="target" position={Position.Left} style={handleStyle} />
        {/* Person silhouette */}
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
          <svg width="34" height="38" viewBox="0 0 34 38" fill="none">
            <circle cx="17" cy="10" r="9" fill="rgba(99,102,241,0.6)" />
            <path d="M1 37 C1 24 33 24 33 37" fill="rgba(99,102,241,0.5)" />
          </svg>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#C4B5FD', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: '#818CF8', fontStyle: 'italic', marginBottom: 5 }}>
          [{stereotype}]
        </div>
        {description && (
          <div style={{ fontSize: 10, color: '#A5B4FC', lineHeight: 1.4 }}>
            {description}
          </div>
        )}
        <Handle type="source" position={Position.Bottom} style={handleStyle} />
        <Handle type="source" position={Position.Right} style={handleStyle} />
      </div>
    )
  }

  if (variant === 'external') {
    return (
      <div style={{
        width: 180, padding: '12px',
        background: 'rgba(100,116,139,0.15)',
        border: '1.5px solid rgba(100,116,139,0.4)',
        borderRadius: 8, textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <Handle type="target" position={Position.Top} style={handleStyle} />
        <Handle type="target" position={Position.Left} style={handleStyle} />
        <div style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8', marginBottom: 2 }}>
          {label}
        </div>
        <div style={{ fontSize: 10, color: '#64748B', fontStyle: 'italic', marginBottom: 5 }}>
          [{stereotype}]
        </div>
        {description && (
          <div style={{ fontSize: 10, color: '#64748B', lineHeight: 1.4 }}>
            {description}
          </div>
        )}
        <Handle type="source" position={Position.Bottom} style={handleStyle} />
        <Handle type="source" position={Position.Right} style={handleStyle} />
      </div>
    )
  }

  // internal (default)
  return (
    <div style={{
      width: 180, padding: '12px',
      background: 'rgba(99,102,241,0.15)',
      border: '1.5px solid rgba(99,102,241,0.5)',
      borderRadius: 8, textAlign: 'center',
      fontFamily: 'Inter, sans-serif',
    }}>
      <Handle type="target" position={Position.Top} style={handleStyle} />
      <Handle type="target" position={Position.Left} style={handleStyle} />
      <div style={{ fontSize: 13, fontWeight: 700, color: '#C4B5FD', marginBottom: 2 }}>
        {label}
      </div>
      <div style={{ fontSize: 10, color: '#818CF8', fontStyle: 'italic', marginBottom: 5 }}>
        [{stereotype}]
      </div>
      {description && (
        <div style={{ fontSize: 10, color: '#A5B4FC', lineHeight: 1.4 }}>
          {description}
        </div>
      )}
      <Handle type="source" position={Position.Bottom} style={handleStyle} />
      <Handle type="source" position={Position.Right} style={handleStyle} />
    </div>
  )
}
