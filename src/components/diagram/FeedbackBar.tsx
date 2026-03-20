'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

const REASONS = [
  { value: 'wrong_structure',  label: 'Wrong structure' },
  { value: 'wrong_type',       label: 'Wrong diagram type' },
  { value: 'too_simple',       label: 'Too simple / missing detail' },
  { value: 'missing_elements', label: 'Missing key elements' },
  { value: 'other',            label: 'Other' },
] as const

interface FeedbackBarProps {
  diagramId: string
  diagramType: string
  userId: string
  /** Key changes on each new generation to reset feedback state */
  generationKey?: string | number
}

export function FeedbackBar({ diagramId, diagramType, userId }: FeedbackBarProps) {
  const [rating, setRating] = useState<'up' | 'down' | null>(null)
  const [showReasons, setShowReasons] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (!diagramId || !userId) return
    supabase
      .from('generation_feedback')
      .select('rating')
      .eq('diagram_id', diagramId)
      .eq('user_id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.rating) {
          setRating(data.rating as 'up' | 'down')
          setSubmitted(true)
        }
      })
  }, [diagramId, userId, supabase])

  async function submit(r: 'up' | 'down', reason?: string) {
    setRating(r)
    setShowReasons(false)
    setSubmitted(true)

    await supabase.from('generation_feedback').insert({
      user_id:      userId,
      diagram_id:   diagramId,
      diagram_type: diagramType,
      rating:       r,
      reason:       reason ?? null,
    })
  }

  if (submitted) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: '#52525B', fontFamily: 'Inter, sans-serif',
      }}>
        <span style={{ color: '#4ADE80', fontSize: 13 }}>✓</span>
        Thanks for the feedback
      </div>
    )
  }

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 11, color: '#3F3F46', fontFamily: 'Inter, sans-serif', userSelect: 'none' }}>
        Was this helpful?
      </span>

      {/* Thumbs up */}
      <button
        onClick={() => submit('up')}
        title="This was helpful"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, lineHeight: 1,
          opacity: rating === 'down' ? 0.3 : 1,
          transition: 'opacity 0.15s, transform 0.1s',
          padding: '3px 5px', borderRadius: 4,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
      >
        👍
      </button>

      {/* Thumbs down */}
      <button
        onClick={() => setShowReasons(true)}
        title="This wasn't helpful"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, lineHeight: 1,
          opacity: rating === 'up' ? 0.3 : 1,
          transition: 'opacity 0.15s',
          padding: '3px 5px', borderRadius: 4,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
      >
        👎
      </button>

      {/* Reason dropdown */}
      {showReasons && (
        <>
          {/* Click-away backdrop */}
          <div
            onClick={() => setShowReasons(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 98 }}
          />
          <div style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: 0,
            background: '#18181B',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 10,
            padding: '6px 0',
            minWidth: 210,
            zIndex: 99,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}>
            <div style={{
              fontSize: 10, color: '#52525B',
              padding: '4px 14px 8px',
              fontFamily: 'Inter, sans-serif', fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>
              What went wrong?
            </div>
            {REASONS.map(r => (
              <button
                key={r.value}
                onClick={() => submit('down', r.value)}
                style={{
                  display: 'block', width: '100%',
                  padding: '8px 14px',
                  background: 'none', border: 'none',
                  color: '#CBD5E1', fontSize: 13,
                  fontFamily: 'Inter, sans-serif', textAlign: 'left',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
              >
                {r.label}
              </button>
            ))}
            <button
              onClick={() => setShowReasons(false)}
              style={{
                display: 'block', width: '100%',
                padding: '7px 14px',
                background: 'none', border: 'none',
                color: '#52525B', fontSize: 12,
                fontFamily: 'Inter, sans-serif', textAlign: 'left',
                cursor: 'pointer',
                borderTop: '1px solid rgba(255,255,255,0.06)',
                marginTop: 4,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = '#94A3B8' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#52525B' }}
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </div>
  )
}
