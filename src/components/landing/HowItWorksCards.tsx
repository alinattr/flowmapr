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

// ─── Card 02: Node-appear animation ──────────────────────────────────────────

// Nodes re-centered for a 200×50 viewBox
const DIAGRAM_NODES = [
  { label: 'Start',    cx: 16,  cy: 25, color: '#22C55E', shape: 'circle',  delay: 0   },
  { label: 'Process',  x:  36,  y: 13,  color: '#6366F1', shape: 'rect',    delay: 0.4 },
  { label: 'Decision', cx: 120, cy: 25, color: '#F59E0B', shape: 'diamond', delay: 0.8 },
  { label: 'End',      cx: 172, cy: 25, color: '#EF4444', shape: 'circle',  delay: 1.2 },
]

function NodeAnimation() {
  const [key, setKey] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setKey(k => k + 1), 4000)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={{ marginTop: 8 }}>
      <svg key={key} width="200" height="50" viewBox="0 0 200 50"
        style={{ overflow: 'visible' }}>
        {/* Connecting lines */}
        <line x1="25" y1="25" x2="36" y2="25"
          stroke="rgba(99,102,241,0.3)" strokeWidth="1"
          style={{ animation: 'nodeAppear 0.4s 1.6s ease both', opacity: 0 }}/>
        <line x1="78" y1="25" x2="108" y2="25"
          stroke="rgba(99,102,241,0.3)" strokeWidth="1"
          style={{ animation: 'nodeAppear 0.4s 1.7s ease both', opacity: 0 }}/>
        <line x1="132" y1="25" x2="163" y2="25"
          stroke="rgba(99,102,241,0.3)" strokeWidth="1"
          style={{ animation: 'nodeAppear 0.4s 1.8s ease both', opacity: 0 }}/>

        {/* Start circle */}
        <g style={{ animation: `nodeAppear 0.5s 0s ease both`, opacity: 0 }}>
          <circle cx="16" cy="25" r="10" fill="#22C55E22" stroke="#22C55E" strokeWidth="1.5"/>
          <text x="16" y="29" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="Inter,sans-serif">Start</text>
        </g>

        {/* Process rect */}
        <g style={{ animation: `nodeAppear 0.5s 0.4s ease both`, opacity: 0 }}>
          <rect x="36" y="13" width="42" height="24" rx="4"
            fill="rgba(99,102,241,0.1)" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
          <text x="57" y="29" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="Inter,sans-serif">Process</text>
        </g>

        {/* Decision diamond */}
        <g style={{ animation: `nodeAppear 0.5s 0.8s ease both`, opacity: 0 }}>
          <polygon points="120,12 132,25 120,38 108,25"
            fill="rgba(245,158,11,0.1)" stroke="#F59E0B" strokeWidth="1.5"/>
          <text x="120" y="29" textAnchor="middle" fontSize="6" fill="rgba(255,255,255,0.5)" fontFamily="Inter,sans-serif">Gate</text>
        </g>

        {/* End circle */}
        <g style={{ animation: `nodeAppear 0.5s 1.2s ease both`, opacity: 0 }}>
          <circle cx="172" cy="25" r="10" fill="#EF444422" stroke="#EF4444" strokeWidth="1.5"/>
          <circle cx="172" cy="25" r="6" fill="rgba(239,68,68,0.3)"/>
          <text x="172" y="29" textAnchor="middle" fontSize="7" fill="rgba(255,255,255,0.5)" fontFamily="Inter,sans-serif">End</text>
        </g>
      </svg>
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
            {i === 1 && <NodeAnimation />}
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
