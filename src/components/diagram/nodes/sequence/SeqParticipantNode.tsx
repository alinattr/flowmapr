'use client'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { useState } from 'react'
import { useReactFlow } from '@xyflow/react'

const LIFELINE_COLORS = ['#6366F1', '#22C55E', '#3B82F6', '#F59E0B', '#A78BFA', '#EC4899', '#14B8A6']

export function SeqParticipantNode({ data, id }: NodeProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(data.label ?? 'Participant'))
  const { updateNodeData } = useReactFlow()
  const colorIndex = typeof data.colorIndex === 'number' ? data.colorIndex : 0
  const lifelineColor = LIFELINE_COLORS[colorIndex % LIFELINE_COLORS.length]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', userSelect: 'none' }}>
      <div className="uml-participant-box" style={{ padding: '8px 20px', borderRadius: 8, minWidth: 100, textAlign: 'center' }}>
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={() => { setEditing(false); updateNodeData(id, { label: draft }) }}
            onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); updateNodeData(id, { label: draft }) } }}
            style={{
              background: 'transparent', border: 'none', outline: 'none',
              color: 'inherit', fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
              textAlign: 'center', width: '100%',
            }}
          />
        ) : (
          <div
            onDoubleClick={() => setEditing(true)}
            style={{ fontSize: 12, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'inherit' }}
          >
            {String(data.label ?? 'Participant')}
          </div>
        )}
      </div>
      {/* Lifeline — keep per-participant color for visual distinction */}
      <div style={{
        width: 1,
        height: typeof data.lifelineHeight === 'number' ? data.lifelineHeight : 300,
        background: `${lifelineColor}30`,
        borderRight: `1px dashed ${lifelineColor}40`,
      }} />
      <Handle type="source" position={Position.Bottom} style={{ opacity: 0 }} />
      <Handle type="target" position={Position.Top} style={{ opacity: 0 }} />
      <Handle type="source" position={Position.Right} id="right" style={{ top: '20px', opacity: 0 }} />
      <Handle type="target" position={Position.Left} id="left" style={{ top: '20px', opacity: 0 }} />
    </div>
  )
}
