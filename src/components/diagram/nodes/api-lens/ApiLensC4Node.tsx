'use client'
import { useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'

type C4Variant = 'person' | 'internal' | 'external'

export function ApiLensC4Node({ data }: NodeProps) {
  const variant = (data.variant as C4Variant) ?? 'internal'
  const label = String(data.label ?? '')
  const stereotype = String(data.stereotype ?? 'Software System')
  const description = String(data.description ?? '')
  const [hovered, setHovered] = useState(false)

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
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
          <svg width="34" height="38" viewBox="0 0 34 38" fill="none">
            <circle cx="17" cy="10" r="9" fill="rgba(99,102,241,0.6)" />
            <path d="M1 37 C1 24 33 24 33 37" fill="rgba(99,102,241,0.5)" />
          </svg>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#C4B5FD', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 10, color: '#818CF8', fontStyle: 'italic', marginBottom: 5 }}>[{stereotype}]</div>
        {description && (
          <div style={{ fontSize: 10, color: '#A5B4FC', lineHeight: 1.4 }}>{description}</div>
        )}
        <Handle type="source" position={Position.Bottom} style={handleStyle} />
        <Handle type="source" position={Position.Right} style={handleStyle} />
      </div>
    )
  }

  const isExternal = variant === 'external'
  const borderColor = isExternal ? 'rgba(100,116,139,0.4)' : 'rgba(99,102,241,0.5)'
  const hoverBorder = isExternal ? 'rgba(100,116,139,0.7)' : 'rgba(99,102,241,0.85)'
  const bgColor = isExternal ? 'rgba(100,116,139,0.15)' : 'rgba(99,102,241,0.15)'
  const hoverBg = isExternal ? 'rgba(100,116,139,0.22)' : 'rgba(99,102,241,0.22)'
  const labelColor = isExternal ? '#94A3B8' : '#C4B5FD'
  const stereoColor = isExternal ? '#64748B' : '#818CF8'
  const descColor = isExternal ? '#64748B' : '#A5B4FC'

  return (
    <div
      style={{ position: 'relative' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Hover tooltip */}
      {hovered && (
        <div style={{
          position: 'absolute',
          bottom: 'calc(100% + 8px)',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(9,9,11,0.95)',
          border: '1px solid rgba(99,102,241,0.35)',
          borderRadius: 6,
          padding: '5px 10px',
          fontSize: 11,
          fontFamily: 'Inter, sans-serif',
          color: '#A5B4FC',
          whiteSpace: 'nowrap',
          zIndex: 999,
          pointerEvents: 'none',
        }}>
          Click to view endpoints
          <div style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '4px solid transparent',
            borderRight: '4px solid transparent',
            borderTop: '4px solid rgba(99,102,241,0.35)',
          }} />
        </div>
      )}

      <div style={{
        width: 180, padding: '12px',
        background: hovered ? hoverBg : bgColor,
        border: `1.5px solid ${hovered ? hoverBorder : borderColor}`,
        borderRadius: 8, textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
        transition: 'background 0.15s ease, border-color 0.15s ease',
        cursor: 'pointer',
        position: 'relative',
      }}>
        <Handle type="target" position={Position.Top} style={handleStyle} />
        <Handle type="target" position={Position.Left} style={handleStyle} />

        {/* Top-right endpoint hint */}
        <div style={{
          position: 'absolute', top: 6, right: 7,
          fontSize: 10, color: 'rgba(165,180,252,0.45)',
          fontFamily: 'Inter, sans-serif', lineHeight: 1,
          userSelect: 'none',
        }}>
          ↗
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: labelColor, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 10, color: stereoColor, fontStyle: 'italic', marginBottom: 5 }}>[{stereotype}]</div>
        {description && (
          <div style={{ fontSize: 10, color: descColor, lineHeight: 1.4 }}>{description}</div>
        )}
        <Handle type="source" position={Position.Bottom} style={handleStyle} />
        <Handle type="source" position={Position.Right} style={handleStyle} />
      </div>
    </div>
  )
}
