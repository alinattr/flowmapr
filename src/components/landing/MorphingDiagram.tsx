'use client'
import { useEffect, useRef, useState } from 'react'
import { DiagramSVG } from './DiagramSVG'

const DIAGRAMS = ['BPMN', 'UML Sequence', 'Flowchart', 'C4', 'API Lens'] as const
export type DiagramType = typeof DIAGRAMS[number]

const CYCLE_DURATION = 4500
const FADE_OUT_MS = 400
const FADE_IN_DELAY = 450

export function MorphingDiagram() {
  const [active, setActive] = useState<DiagramType>('BPMN')
  const [visible, setVisible] = useState(true)
  const indexRef = useRef(0)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const tick = () => {
      setVisible(false)
      timerRef.current = setTimeout(() => {
        indexRef.current = (indexRef.current + 1) % DIAGRAMS.length
        setActive(DIAGRAMS[indexRef.current])
        setVisible(true)
      }, FADE_IN_DELAY)
    }
    const interval = setInterval(tick, CYCLE_DURATION)
    return () => {
      clearInterval(interval)
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <div style={{
      width: '100%', maxWidth: 900, borderRadius: 16,
      border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden',
      boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 120px rgba(99,102,241,0.08)',
      background: '#0D0D10', position: 'relative',
    }}>
      {/* Browser chrome */}
      <div style={{
        height: 44, background: '#111113',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8,
      }}>
        {['#FF5F57', '#FFBD2E', '#28C840'].map(c => (
          <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c, opacity: 0.8 }}/>
        ))}
        <div style={{
          flex: 1, maxWidth: 300, marginLeft: 16, height: 26, borderRadius: 6,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', alignItems: 'center', padding: '0 10px',
          fontSize: 11, color: '#52525B', fontFamily: 'Inter, sans-serif',
        }}>
          app.flowmapr.com
        </div>
        <div style={{
          marginLeft: 'auto', padding: '4px 12px', borderRadius: 100,
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
          fontSize: 11, fontWeight: 600, color: '#A78BFA', fontFamily: 'Inter, sans-serif',
          opacity: visible ? 1 : 0, transition: `opacity ${FADE_OUT_MS}ms ease`,
        }}>
          {active}
        </div>
      </div>

      {/* Canvas */}
      <div style={{
        height: 320, padding: '16px 24px',
        overflow: 'hidden',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: visible ? 1 : 0,
        transition: `opacity ${FADE_OUT_MS}ms ease`,
        willChange: 'opacity',
      }}>
        <DiagramSVG type={active} />
      </div>

      {/* Bottom indicators */}
      <div style={{
        height: 40, background: '#111113',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center',
        justifyContent: 'center', gap: 24, padding: '0 24px',
      }}>
        {DIAGRAMS.map(type => (
          <div
            key={type}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              opacity: active === type ? 1 : 0.35,
              transition: 'opacity 0.3s ease',
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: active === type ? '#6366F1' : '#3F3F46',
              boxShadow: active === type ? '0 0 6px #6366F1' : 'none',
              transition: 'all 0.3s ease',
            }}/>
            <span style={{
              fontSize: 11, fontFamily: 'Inter, sans-serif',
              color: active === type ? '#A78BFA' : '#52525B',
              transition: 'color 0.3s ease',
            }}>
              {type}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
