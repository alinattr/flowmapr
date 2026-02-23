'use client'

import { Handle, Position, type NodeProps } from '@xyflow/react'

interface UmlAttribute {
  visibility: '+' | '-' | '#'
  name: string
  type: string
}

interface UmlMethod {
  visibility: '+' | '-' | '#'
  name: string
  params: string
  returnType: string
}

interface UmlClassData {
  name: string
  stereotype?: string | null
  attributes?: UmlAttribute[]
  methods?: UmlMethod[]
}

const handleStyle = {
  width: 6,
  height: 6,
  background: 'var(--color-accent-brand)',
  border: 'none',
  opacity: 0,
}

const VIS_COLOR: Record<string, string> = {
  '+': '#16A34A',
  '-': '#DC2626',
  '#': '#D97706',
}

export function UmlClassNode({ data, selected }: NodeProps) {
  const {
    name = 'ClassName',
    stereotype,
    attributes = [],
    methods = [],
  } = data as UmlClassData

  return (
    <div
      style={{
        minWidth: 220,
        borderRadius: 4,
        border: selected
          ? '2.5px solid var(--color-diagram-selected)'
          : '1.5px solid var(--color-border)',
        boxShadow: selected
          ? '0 0 0 3px var(--color-accent-subtle)'
          : '0 1px 3px rgba(0,0,0,0.06)',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          backgroundColor: 'var(--color-accent-subtle)',
          borderBottom: '1px solid var(--color-border)',
          padding: '10px 14px',
          textAlign: 'center',
        }}
      >
        {stereotype && (
          <div
            style={{
              fontSize: 11,
              fontStyle: 'italic',
              color: 'var(--color-text-secondary)',
              marginBottom: 2,
            }}
          >
            {stereotype}
          </div>
        )}
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--color-text-primary)',
          }}
        >
          {name}
        </div>
      </div>

      {/* Attributes */}
      <div style={{ padding: '8px 14px', minHeight: 28 }}>
        {attributes.length > 0 ? (
          attributes.map((attr, i) => (
            <div
              key={i}
              style={{
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--color-text-primary)',
                lineHeight: '20px',
                display: 'flex',
                gap: 2,
              }}
            >
              <span style={{ color: VIS_COLOR[attr.visibility] || '#71717A', fontWeight: 600 }}>
                {attr.visibility}
              </span>
              <span>
                {attr.name}: {attr.type}
              </span>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 11, color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>
            No attributes
          </div>
        )}
      </div>

      {/* Methods */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--color-border)',
          backgroundColor: '#FAFAFA',
          minHeight: 28,
        }}
      >
        {methods.length > 0 ? (
          methods.map((method, i) => (
            <div
              key={i}
              style={{
                fontSize: 12,
                fontFamily: 'JetBrains Mono, monospace',
                color: 'var(--color-text-secondary)',
                lineHeight: '20px',
                display: 'flex',
                gap: 2,
              }}
            >
              <span style={{ color: VIS_COLOR[method.visibility] || '#71717A', fontWeight: 600 }}>
                {method.visibility}
              </span>
              <span>
                {method.name}({method.params}): {method.returnType}
              </span>
            </div>
          ))
        ) : (
          <div style={{ fontSize: 11, color: 'var(--color-text-disabled)', fontStyle: 'italic' }}>
            No methods
          </div>
        )}
      </div>

      <Handle type="target" position={Position.Left} id="left" style={handleStyle} />
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />
    </div>
  )
}
