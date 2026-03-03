'use client'

import { useState, useEffect } from 'react'

// ─── Card 01: Typewriter animation ───────────────────────────────────────────

const PROMPTS = [
  'Payment checkout flow...',
  'User registration with KYC...',
  'Microservices architecture...',
  'API authentication flow...',
]

function TypewriterPrompt() {
  const [promptIndex, setPromptIndex] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [typing, setTyping] = useState(true)

  useEffect(() => {
    const current = PROMPTS[promptIndex]
    if (typing) {
      if (displayedText.length < current.length) {
        const t = setTimeout(() => {
          setDisplayedText(current.slice(0, displayedText.length + 1))
        }, 60)
        return () => clearTimeout(t)
      } else {
        const t = setTimeout(() => setTyping(false), 1400)
        return () => clearTimeout(t)
      }
    } else {
      if (displayedText.length > 0) {
        const t = setTimeout(() => {
          setDisplayedText(displayedText.slice(0, -1))
        }, 30)
        return () => clearTimeout(t)
      } else {
        setPromptIndex(i => (i + 1) % PROMPTS.length)
        setTyping(true)
      }
    }
  }, [displayedText, typing, promptIndex])

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginTop: 8,
    }}>
      <div style={{
        padding: '5px 10px',
        background: 'rgba(99,102,241,0.08)',
        border: '1px solid rgba(99,102,241,0.2)',
        borderRadius: 6,
        fontSize: 10,
        fontFamily: "'JetBrains Mono', monospace",
        color: 'rgba(139,92,246,0.8)',
        maxWidth: 200,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
      }}>
        {displayedText}
        <span style={{
          display: 'inline-block',
          width: 1,
          height: 10,
          background: '#6366F1',
          marginLeft: 1,
          verticalAlign: 'middle',
          animation: 'blink 1s infinite',
        }}/>
      </div>
    </div>
  )
}

// ─── Card 02: AI generating animation ────────────────────────────────────────

function GeneratingAnimation() {
  const [phase, setPhase] = useState<'idle' | 'loading' | 'done'>('idle')

  useEffect(() => {
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    const run = () => {
      if (cancelled) return
      setPhase('idle')
      timers.push(setTimeout(() => { if (!cancelled) setPhase('loading') }, 100))
      timers.push(setTimeout(() => { if (!cancelled) setPhase('done') }, 1200))
      timers.push(setTimeout(() => { if (!cancelled) run() }, 3500))
    }

    run()
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [])

  const badges = [
    { label: 'BPMN',    color: '#6366F1' },
    { label: 'UML Seq', color: '#22C55E' },
    { label: 'C4',      color: '#A78BFA' },
    { label: 'ERD',     color: '#3B82F6' },
  ]

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 10,
      width: '100%',
      padding: '0 16px',
    }}>
      {/* Status label */}
      <div style={{
        fontSize: 10,
        fontFamily: 'Inter, sans-serif',
        color: phase === 'done' ? '#4ADE80' : 'rgba(99,102,241,0.6)',
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        transition: 'color 0.3s ease',
      }}>
        {phase === 'done' ? '✓ Generated' : phase === 'loading' ? 'Generating...' : '·'}
      </div>

      {/* Progress bar */}
      <div style={{
        width: '100%',
        height: 3,
        background: 'rgba(99,102,241,0.1)',
        borderRadius: 99,
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          borderRadius: 99,
          background: phase === 'done'
            ? 'linear-gradient(90deg, #22C55E, #4ADE80)'
            : 'linear-gradient(90deg, #6366F1, #8B5CF6)',
          width: phase === 'idle' ? '0%' : '100%',
          transition: phase === 'loading'
            ? 'width 1.0s ease'
            : phase === 'done'
            ? 'background 0.3s ease'
            : 'none',
          boxShadow: phase === 'done'
            ? '0 0 8px rgba(34,197,94,0.5)'
            : '0 0 8px rgba(99,102,241,0.5)',
        }}/>
      </div>

      {/* Result type badges */}
      <div style={{
        display: 'flex',
        gap: 5,
        flexWrap: 'wrap',
        justifyContent: 'center',
        opacity: phase === 'done' ? 1 : 0,
        transform: phase === 'done' ? 'translateY(0)' : 'translateY(6px)',
        transition: 'all 0.4s ease',
      }}>
        {badges.map((b, i) => (
          <div key={b.label} style={{
            padding: '3px 7px',
            borderRadius: 4,
            background: `${b.color}18`,
            border: `1px solid ${b.color}35`,
            fontSize: 9,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            color: b.color,
            opacity: phase === 'done' ? 1 : 0,
            transform: phase === 'done' ? 'scale(1)' : 'scale(0.85)',
            transition: `all 0.2s ease ${i * 0.08}s`,
          }}>
            {b.label}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Card 03: Export buttons animation ───────────────────────────────────────

const EXPORT_ACTIONS = [
  { label: '↓ PNG',   color: '#6366F1', delay: 0   },
  { label: '↓ PDF',   color: '#8B5CF6', delay: 0.3 },
  { label: '↗ Share', color: '#22C55E', delay: 0.6 },
  { label: '</> XML', color: '#F59E0B', delay: 0.9 },
]

function ExportAnimation() {
  const [key, setKey] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setKey(k => k + 1), 3000)
    return () => clearInterval(id)
  }, [])

  return (
    <div key={key} style={{
      display: 'flex',
      flexDirection: 'row',
      gap: 6,
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginTop: 8,
    }}>
      {EXPORT_ACTIONS.map(a => (
        <div
          key={a.label}
          style={{
            padding: '4px 8px',
            borderRadius: 4,
            background: `${a.color}15`,
            border: `1px solid ${a.color}40`,
            fontSize: 9,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            color: a.color,
            opacity: 0,
            animation: `nodeAppear 0.4s ${a.delay}s ease forwards`,
          }}
        >
          {a.label}
        </div>
      ))}
    </div>
  )
}

// ─── Step badge ───────────────────────────────────────────────────────────────

function StepBadge({ num }: { num: string }) {
  return (
    <div style={{
      position: 'absolute',
      top: 10, left: 12,
      width: 28, height: 28,
      borderRadius: 7,
      background: 'rgba(99,102,241,0.2)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 10, fontWeight: 700,
      color: '#818CF8', fontFamily: 'Inter, sans-serif',
    }}>
      {num}
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const STEP_CONTENT = [
  {
    num: '01',
    title: 'Describe your process or paste your API spec',
    desc: 'Write what happens in plain English, or drop in an OpenAPI spec, Swagger file, or code with API routes.',
  },
  {
    num: '02',
    title: 'Get a diagram in seconds',
    desc: 'Flowmapr generates BPMN, UML Sequence, ERD, Flowchart, C4 architecture, or interactive API docs — your choice.',
  },
  {
    num: '03',
    title: 'Edit visually, share with a link, export anywhere',
    desc: 'Drag nodes, reconnect edges, edit labels. Share a read-only link or export to PNG, PDF, or BPMN 2.0 XML.',
  },
]

export function HowItWorksCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
      {STEP_CONTENT.map((step, i) => (
        <div
          key={i}
          style={{
            position: 'relative',
            overflow: 'hidden',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            padding: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Illustration area — fixed 90px height */}
          <div style={{
            height: 90,
            position: 'relative',
            overflow: 'hidden',
            borderBottom: '1px solid rgba(255,255,255,0.04)',
            background: 'rgba(99,102,241,0.03)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 16px',
          }}>
            <StepBadge num={step.num} />
          {i === 0 && <TypewriterPrompt />}
          {i === 1 && <GeneratingAnimation />}
          {i === 2 && <ExportAnimation />}
          </div>

          {/* Text area — always below illustration */}
          <div style={{ padding: '16px 20px 20px' }}>
            <div style={{
              fontSize: 14, fontWeight: 600,
              color: '#F1F5F9', fontFamily: 'Inter, sans-serif',
              marginBottom: 6, lineHeight: 1.4,
            }}>
              {step.title}
            </div>
            <div style={{
              fontSize: 12, color: '#71717A',
              fontFamily: 'Inter, sans-serif', lineHeight: 1.6,
            }}>
              {step.desc}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
