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
  const distributedSourceHandles = [20, 35, 50, 65, 80]
  const palette =
    variant === 'person'
      ? { bg: '#08427B', border: '#062f58', header: '#0B4E90', title: '#FFFFFF', type: 'rgba(255,255,255,0.88)', desc: 'rgba(255,255,255,0.86)', handle: '#FFFFFF' }
      : variant === 'external'
        ? { bg: '#999999', border: '#6b6b6b', header: '#7f7f7f', title: '#FFFFFF', type: 'rgba(255,255,255,0.88)', desc: 'rgba(255,255,255,0.86)', handle: '#FFFFFF' }
        : { bg: '#1168BD', border: '#0e5ca8', header: '#0e5ca8', title: '#FFFFFF', type: 'rgba(255,255,255,0.88)', desc: 'rgba(255,255,255,0.86)', handle: '#FFFFFF' }

  if (variant === 'person') {
    return (
      <div style={{
        width: 160, padding: '14px 12px 12px',
        background: palette.bg,
        border: `2px solid ${palette.border}`,
        borderRadius: 8, textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <Handle id="target-top" type="target" position={Position.Top} style={handleStyle} />
        <Handle type="target" position={Position.Left} style={handleStyle} />
        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'center' }}>
          <svg width="34" height="38" viewBox="0 0 34 38" fill="none">
            <circle cx="17" cy="10" r="9" fill="rgba(255,255,255,0.42)" />
            <path d="M1 37 C1 24 33 24 33 37" fill="rgba(255,255,255,0.34)" />
          </svg>
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: palette.title, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 10, color: palette.type, fontStyle: 'italic', marginBottom: 5 }}>[Person]</div>
        {description && (
          <div style={{ fontSize: 10, color: palette.desc, lineHeight: 1.4 }}>{description}</div>
        )}
        {distributedSourceHandles.map((left, i) => (
          <Handle key={`sb-${i}`} id={`source-bottom-${i + 1}`} type="source" position={Position.Bottom}
            style={{ ...handleStyle, left: `${left}%`, background: palette.handle }} />
        ))}
        <Handle type="source" position={Position.Right} style={handleStyle} />
      </div>
    )
  }

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
        background: hovered ? palette.header : palette.bg,
        border: `2px solid ${palette.border}`,
        borderRadius: 8, textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
        transition: 'background 0.15s ease',
        cursor: 'pointer',
        position: 'relative',
      }}>
        <Handle id="target-top" type="target" position={Position.Top} style={handleStyle} />
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

        <div style={{ fontSize: 13, fontWeight: 700, color: palette.title, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 10, color: palette.type, fontStyle: 'italic', marginBottom: 5 }}>[{stereotype}]</div>
        {description && (
          <div style={{ fontSize: 10, color: palette.desc, lineHeight: 1.4 }}>{description}</div>
        )}
        {distributedSourceHandles.map((left, i) => (
          <Handle key={`sb-${i}`} id={`source-bottom-${i + 1}`} type="source" position={Position.Bottom}
            style={{ ...handleStyle, left: `${left}%`, background: palette.handle }} />
        ))}
        <Handle type="source" position={Position.Right} style={handleStyle} />
      </div>
    </div>
  )
}
