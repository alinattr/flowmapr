'use client'

import { useState, useMemo, useEffect } from 'react'

export interface SeqParticipant {
  id: string
  label: string
  type: 'actor' | 'object' | 'database' | 'system' | 'boundary'
  x: number
}

export interface SeqMessage {
  id: string
  from: string
  to: string
  label: string
  type: 'sync' | 'return' | 'async' | 'create' | 'destroy'
  y: number
}

export interface SeqFragment {
  id: string
  type: 'alt' | 'loop' | 'opt' | 'par' | 'ref'
  condition: string
  elseCondition?: string
  yStart: number
  yEnd: number
  xStart: number
  xEnd: number
}

export interface SequenceData {
  title?: string
  participants: SeqParticipant[]
  messages: SeqMessage[]
  fragments?: SeqFragment[]
}

const PW = 120
const PH = 40
const LIFELINE_TOP = 80

const C = {
  primary: 'rgba(99,102,241,0.8)',
  primaryLight: 'rgba(99,102,241,0.5)',
  primaryBg: 'rgba(99,102,241,0.1)',
  returnLine: 'rgba(167,139,250,0.6)',
  returnText: 'rgba(167,139,250,0.8)',
  lifeline: 'rgba(99,102,241,0.2)',
  activation: 'rgba(234,179,8,0.2)',
  activationBorder: 'rgba(234,179,8,0.5)',
  fragBg: 'rgba(99,102,241,0.03)',
  fragBorder: 'rgba(99,102,241,0.3)',
  fragText: 'rgba(99,102,241,0.7)',
  text: 'rgba(148,163,184,0.9)',
}

const INPUT_STYLE: React.CSSProperties = {
  background: 'var(--color-surface, #18181B)',
  border: '1px solid rgba(99,102,241,0.5)',
  borderRadius: 4,
  padding: '2px 6px',
  fontSize: 11,
  color: 'var(--color-text-primary, #E2E8F0)',
  fontFamily: 'Inter, sans-serif',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
}

interface SequenceRendererProps {
  data: SequenceData
  onEdit?: (updated: SequenceData) => void
  readOnly?: boolean
}

export function SequenceRenderer({ data, onEdit, readOnly = false }: SequenceRendererProps) {
  const { participants, messages, fragments = [] } = data
  const editable = !readOnly && !!onEdit

  const participantBoxWidth = useMemo(() => {
    const measure = (label: string) => {
      if (typeof window === 'undefined') return label.length * 7
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) return label.length * 7
      // Keep in sync with participant text style (11px, weight 600, Inter)
      ctx.font = '600 11px Inter, sans-serif'
      return ctx.measureText(label).width
    }

    const widths: Record<string, number> = {}
    participants.forEach((p) => {
      // 16px horizontal padding on each side + measured label width.
      widths[p.id] = Math.max(80, Math.ceil(measure(p.label)) + 32)
    })
    return widths
  }, [participants])

  const [editingParticipant, setEditingParticipant] = useState<string | null>(null)
  const [editingMessage, setEditingMessage] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(editable)

  useEffect(() => {
    if (!showHint) return
    const t = setTimeout(() => setShowHint(false), 4000)
    return () => clearTimeout(t)
  }, [showHint])

  const totalHeight = useMemo(() => {
    if (messages.length === 0) return 400
    return Math.max(...messages.map(m => m.y)) + 120
  }, [messages])

  const totalWidth = useMemo(() => {
    if (participants.length === 0) return 600
    return Math.max(
      ...participants.map((p) => p.x + PW / 2 + (participantBoxWidth[p.id] ?? PW) / 2)
    ) + 80
  }, [participants, participantBoxWidth])

  const activations = useMemo(() => {
    const result: Array<{ pid: string; cx: number; yStart: number; yEnd: number }> = []
    for (const p of participants) {
      const received = messages.filter(m => m.to === p.id && m.type !== 'return')
      if (received.length === 0) continue
      const allY = messages.filter(m => m.to === p.id || m.from === p.id).map(m => m.y)
      const yStart = Math.min(...allY)
      const yEnd = Math.max(...allY)
      result.push({ pid: p.id, cx: p.x + PW / 2, yStart: yStart - 8, yEnd: yEnd + 12 })
    }
    return result
  }, [participants, messages])

  function commitParticipant(pid: string, value: string) {
    setEditingParticipant(null)
    const trimmed = value.trim()
    if (!trimmed) return
    const p = participants.find(x => x.id === pid)
    if (p && trimmed !== p.label) {
      onEdit?.({
        ...data,
        participants: participants.map(x => x.id === pid ? { ...x, label: trimmed } : x),
      })
    }
  }

  function commitMessage(mid: string, value: string) {
    setEditingMessage(null)
    const trimmed = value.trim()
    if (!trimmed) return
    const m = messages.find(x => x.id === mid)
    if (m && trimmed !== m.label) {
      onEdit?.({
        ...data,
        messages: messages.map(x => x.id === mid ? { ...x, label: trimmed } : x),
      })
    }
  }

  const editCursor = editable ? 'text' : 'default'

  return (
    <svg
      data-diagram="sequence"
      width="100%"
      height={totalHeight + 50}
      viewBox={`0 0 ${totalWidth} ${totalHeight + 50}`}
      style={{ fontFamily: 'Inter, sans-serif', overflow: 'visible' }}
    >
      <defs>
        <marker id="seqArrow" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={C.primary} />
        </marker>
        <marker id="seqArrowRet" markerWidth="8" markerHeight="6" refX="7" refY="3" orient="auto">
          <polyline points="0 0, 8 3, 0 6" fill="none" stroke={C.returnLine} strokeWidth="1" />
        </marker>
      </defs>

      {/* Fragments */}
      {fragments.map(frag => (
        <g key={frag.id}>
          <rect
            x={frag.xStart} y={frag.yStart}
            width={frag.xEnd - frag.xStart} height={frag.yEnd - frag.yStart}
            fill={C.fragBg} stroke={C.fragBorder} strokeWidth="1" rx="2"
          />
          <polygon
            points={`${frag.xStart},${frag.yStart} ${frag.xStart + 40},${frag.yStart} ${frag.xStart + 48},${frag.yStart + 12} ${frag.xStart + 40},${frag.yStart + 24} ${frag.xStart},${frag.yStart + 24}`}
            fill={C.primaryBg} stroke={C.fragBorder} strokeWidth="1"
          />
          <text x={frag.xStart + 8} y={frag.yStart + 16} fontSize="11" fontWeight="700" fill={C.fragText}>
            {frag.type}
          </text>
          <text x={frag.xStart + 56} y={frag.yStart + 16} fontSize="10" fill={C.fragText}>
            [{frag.condition}]
          </text>
          {frag.elseCondition && (
            <>
              <line
                x1={frag.xStart} y1={(frag.yStart + frag.yEnd) / 2}
                x2={frag.xEnd} y2={(frag.yStart + frag.yEnd) / 2}
                stroke={C.fragBorder} strokeWidth="1" strokeDasharray="5 3"
              />
              <text x={frag.xStart + 8} y={(frag.yStart + frag.yEnd) / 2 + 14}
                fontSize="10" fill={C.fragText}>
                [{frag.elseCondition}]
              </text>
            </>
          )}
        </g>
      ))}

      {/* Lifelines */}
      {participants.map(p => (
        <line key={`ll-${p.id}`}
          x1={p.x + PW / 2} y1={LIFELINE_TOP + PH / 2}
          x2={p.x + PW / 2} y2={totalHeight}
          stroke={C.lifeline} strokeWidth="1" strokeDasharray="5 4"
        />
      ))}

      {/* Activation bars */}
      {activations.map(a => (
        <rect key={`act-${a.pid}`}
          x={a.cx - 6} y={a.yStart} width={12} height={a.yEnd - a.yStart}
          fill={C.activation} stroke={C.activationBorder} strokeWidth="1" rx="1"
        />
      ))}

      {/* Messages */}
      {messages.map(msg => {
        const fromP = participants.find(p => p.id === msg.from)
        const toP = participants.find(p => p.id === msg.to)
        if (!fromP || !toP) return null

        const fromX = fromP.x + PW / 2
        const toX = toP.x + PW / 2
        const isReturn = msg.type === 'return'
        const goesRight = toX >= fromX

        const x1 = goesRight ? fromX + 6 : fromX - 6
        const x2 = goesRight ? toX - 6 : toX + 6

        const midX = (fromX + toX) / 2
        const labelW = msg.label.length * 5.5 + 16

        return (
          <g key={msg.id}>
            <line
              x1={x1} y1={msg.y} x2={x2} y2={msg.y}
              stroke={isReturn ? C.returnLine : C.primary}
              strokeWidth="1.5"
              strokeDasharray={isReturn ? '5 3' : 'none'}
              markerEnd={isReturn ? 'url(#seqArrowRet)' : 'url(#seqArrow)'}
            />

            {editingMessage === msg.id ? (
              <foreignObject
                x={midX - 90} y={msg.y - 22}
                width="180" height="20"
              >
                <input
                  autoFocus
                  defaultValue={msg.label}
                  style={{ ...INPUT_STYLE, textAlign: 'center', fontSize: 10 }}
                  onBlur={e => commitMessage(msg.id, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    if (e.key === 'Escape') setEditingMessage(null)
                  }}
                />
              </foreignObject>
            ) : (
              <>
                <rect
                  x={midX - labelW / 2} y={msg.y - 17} width={labelW} height="14"
                  fill="var(--color-bg-primary, #0D0D10)" rx="2"
                />
                <text
                  x={midX} y={msg.y - 7} textAnchor="middle" fontSize="10"
                  fill={isReturn ? C.returnText : C.text}
                  style={{ cursor: editCursor }}
                  onDoubleClick={() => editable && setEditingMessage(msg.id)}
                >
                  {msg.label}
                </text>
              </>
            )}
          </g>
        )
      })}

      {/* Participant boxes */}
      {participants.map(p => {
        const cx = p.x + PW / 2
        const isEditing = editingParticipant === p.id
        const dynamicW = participantBoxWidth[p.id] ?? PW

        if (p.type === 'actor') {
          return (
            <g key={p.id}>
              <circle cx={cx} cy={LIFELINE_TOP - 48} r="9"
                fill="none" stroke={C.primaryLight} strokeWidth="1.5" />
              <line x1={cx} y1={LIFELINE_TOP - 39} x2={cx} y2={LIFELINE_TOP - 22}
                stroke={C.primaryLight} strokeWidth="1.5" />
              <line x1={cx - 11} y1={LIFELINE_TOP - 32} x2={cx + 11} y2={LIFELINE_TOP - 32}
                stroke={C.primaryLight} strokeWidth="1.5" />
              <line x1={cx} y1={LIFELINE_TOP - 22} x2={cx - 9} y2={LIFELINE_TOP - 10}
                stroke={C.primaryLight} strokeWidth="1.5" />
              <line x1={cx} y1={LIFELINE_TOP - 22} x2={cx + 9} y2={LIFELINE_TOP - 10}
                stroke={C.primaryLight} strokeWidth="1.5" />
              {isEditing ? (
                <foreignObject x={cx - dynamicW / 2} y={LIFELINE_TOP + 2} width={dynamicW} height="22">
                  <input
                    autoFocus
                    defaultValue={p.label}
                    style={{ ...INPUT_STYLE, textAlign: 'center', whiteSpace: 'nowrap', padding: '4px 6px' }}
                    onBlur={e => commitParticipant(p.id, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                      if (e.key === 'Escape') setEditingParticipant(null)
                    }}
                  />
                </foreignObject>
              ) : (
                <text x={cx} y={LIFELINE_TOP + 14} textAnchor="middle"
                  fontSize="11" fontWeight="600" fill={C.primary}
                  style={{ cursor: editCursor, whiteSpace: 'nowrap' }}
                  onDoubleClick={() => editable && setEditingParticipant(p.id)}>
                  {p.label}
                </text>
              )}
            </g>
          )
        }

        return (
          <g key={p.id}>
            <rect x={cx - dynamicW / 2} y={LIFELINE_TOP - PH / 2} width={dynamicW} height={PH} rx="4"
              fill={C.primaryBg} stroke={C.primaryLight} strokeWidth="1.5" />
            {isEditing ? (
              <foreignObject x={cx - dynamicW / 2 + 4} y={LIFELINE_TOP - 10} width={Math.max(40, dynamicW - 8)} height="22">
                <input
                  autoFocus
                  defaultValue={p.label}
                  style={{ ...INPUT_STYLE, textAlign: 'center', whiteSpace: 'nowrap', padding: '4px 6px' }}
                  onBlur={e => commitParticipant(p.id, e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
                    if (e.key === 'Escape') setEditingParticipant(null)
                  }}
                />
              </foreignObject>
            ) : (
              <text x={cx} y={LIFELINE_TOP + 5} textAnchor="middle"
                fontSize="11" fontWeight="600" fill={C.primary}
                style={{ cursor: editCursor, whiteSpace: 'nowrap' }}
                onDoubleClick={() => editable && setEditingParticipant(p.id)}>
                {p.label}
              </text>
            )}
          </g>
        )
      })}

      {/* Edit hint */}
      {showHint && (
        <text x="10" y={totalHeight + 40} fontSize="10" fill="rgba(99,102,241,0.35)"
          style={{ transition: 'opacity 0.5s' }}>
          Double-click any text to edit
        </text>
      )}
    </svg>
  )
}
