'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useReactFlow } from '@xyflow/react'
import { useState } from 'react'

interface ErdField {
  name: string
  type: string
  // New schema (from AI prompt)
  key?: 'PK' | 'FK' | 'UQ' | null
  // Legacy schema (backward compat)
  isPk?: boolean
  isFk?: boolean
  isNullable?: boolean
}

function resolveKeyType(field: ErdField): 'PK' | 'FK' | 'UQ' | null {
  if (field.key !== undefined) return field.key
  if (field.isPk) return 'PK'
  if (field.isFk) return 'FK'
  return null
}

export function ErdEntityNode({ data, id }: NodeProps) {
  const { updateNodeData } = useReactFlow()
  const [editing, setEditing] = useState(false)
  const [labelDraft, setLabelDraft] = useState(String(data.label ?? 'Entity'))
  const fields: ErdField[] = Array.isArray(data.fields) ? (data.fields as ErdField[]) : []
  const color = String(data.color ?? '#3B82F6')

  return (
    <div
      className="erd-entity-node"
      style={{
        borderRadius: 10,
        overflow: 'hidden',
        minWidth: 180,
        border: `1.5px solid ${color}60`,
        boxShadow: `0 4px 16px ${color}15`,
      }}
    >
      <Handle type="source" position={Position.Bottom} style={{ background: color }} />
      <Handle type="target" position={Position.Top} style={{ background: color }} />
      <Handle type="source" position={Position.Right} id="right" style={{ background: color }} />
      <Handle type="target" position={Position.Left} id="left" style={{ background: color }} />

      {/* Header */}
      <div
        className="erd-entity-header"
        style={{ borderBottom: `1.5px solid ${color}40`, background: `${color}20` }}
      >
        {editing ? (
          <input
            autoFocus
            value={labelDraft}
            onChange={e => setLabelDraft(e.target.value)}
            onBlur={() => { setEditing(false); updateNodeData(id, { label: labelDraft }) }}
            onKeyDown={e => {
              if (e.key === 'Enter') { setEditing(false); updateNodeData(id, { label: labelDraft }) }
              if (e.key === 'Escape') setEditing(false)
            }}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif',
              textAlign: 'center', width: '100%',
            }}
          />
        ) : (
          <div
            onDoubleClick={() => setEditing(true)}
            style={{ fontWeight: 700, fontSize: 13, fontFamily: 'Inter, sans-serif', textAlign: 'center', cursor: 'text' }}
          >
            {String(data.label ?? 'Entity')}
          </div>
        )}
      </div>

      {/* Fields */}
      <div>
        {fields.map((field, i) => {
          const keyType = resolveKeyType(field)
          return (
            <div key={i} className={`erd-field-row${keyType ? ' erd-field-key' : ''}`}>
              <span className="erd-field-icon">
                {keyType === 'PK' ? '🔑' : keyType === 'FK' ? '🔗' : keyType === 'UQ' ? '◆' : '·'}
              </span>
              <span className="erd-field-name">{field.name}</span>
              <span className="erd-field-type">{field.type}{field.isNullable ? '?' : ''}</span>
            </div>
          )
        })}
        {fields.length === 0 && (
          <div style={{ padding: '8px 14px', fontSize: 11, fontFamily: 'Inter, sans-serif', textAlign: 'center', fontStyle: 'italic' }}
            className="erd-field-name">
            no fields
          </div>
        )}
      </div>
    </div>
  )
}
