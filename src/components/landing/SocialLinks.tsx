'use client'
import { useState } from 'react'

const linkStyle: React.CSSProperties = {
  width: 32, height: 32, borderRadius: 8,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.2s ease', color: '#71717A', textDecoration: 'none',
}

export function SocialLinks() {
  const [igTooltip, setIgTooltip] = useState(false)

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      {/* Telegram */}
      <a
        href="https://t.me/+rJFRTxp9cN04N2Ey"
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
          e.currentTarget.style.color = '#E2E8F0'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
          e.currentTarget.style.color = '#71717A'
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.69 7.96c-.12.58-.46.72-.93.45l-2.57-1.89-1.24 1.19c-.14.14-.25.25-.51.25l.18-2.61 4.72-4.27c.2-.18-.04-.28-.32-.1L7.46 15.2 4.93 14.4c-.56-.17-.57-.56.12-.83l9.29-3.58c.47-.17.87.11.3.81z"/>
        </svg>
      </a>

      {/* Instagram — coming soon */}
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setIgTooltip(v => !v)}
          style={{
            ...linkStyle,
            cursor: 'not-allowed',
            opacity: 0.5,
            border: 'none',
            padding: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
          </svg>
        </button>
        {igTooltip && (
          <div style={{
            position: 'absolute', bottom: '140%', left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(9,9,11,0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 8, padding: '8px 12px',
            fontSize: 12, color: '#A78BFA', whiteSpace: 'nowrap',
            fontFamily: 'Inter, sans-serif',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            zIndex: 10,
          }}>
            Coming soon ✦
          </div>
        )}
      </div>
    </div>
  )
}
