'use client'
import { useState, useEffect } from 'react'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent')
    if (!consent) {
      const t = setTimeout(() => setVisible(true), 1500)
      return () => clearTimeout(t)
    }
  }, [])

  const accept = () => {
    localStorage.setItem('cookie_consent', 'accepted')
    localStorage.setItem('cookie_consent_date', new Date().toISOString())
    setVisible(false)
  }

  const decline = () => {
    localStorage.setItem('cookie_consent', 'declined')
    localStorage.setItem('cookie_consent_date', new Date().toISOString())
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 48px)',
        maxWidth: 580,
        zIndex: 9999,
        borderRadius: 14,
        background: 'rgba(18,18,24,0.95)',
        border: '1px solid rgba(99,102,241,0.2)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        animation: 'slideUpFade 0.4s ease',
      }}
    >
      {/* Cookie icon */}
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'rgba(99,102,241,0.15)',
          border: '1px solid rgba(99,102,241,0.25)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          flexShrink: 0,
        }}
      >
        🍪
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#F1F5F9',
            fontFamily: 'Inter, sans-serif',
            marginBottom: 3,
          }}
        >
          We use cookies
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#71717A',
            fontFamily: 'Inter, sans-serif',
            lineHeight: 1.5,
          }}
        >
          We use essential cookies for auth and optional analytics to improve Flowmapr.{' '}
          <a
            href="/privacy"
            style={{
              color: '#818CF8',
              textDecoration: 'none',
              borderBottom: '1px solid rgba(129,140,248,0.3)',
            }}
          >
            Privacy Policy
          </a>
        </div>
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
        <button
          onClick={decline}
          style={{
            padding: '7px 14px',
            borderRadius: 8,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.1)',
            color: '#94A3B8',
            fontSize: 12,
            fontWeight: 500,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Decline
        </button>
        <button
          onClick={accept}
          style={{
            padding: '7px 14px',
            borderRadius: 8,
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            border: 'none',
            color: 'white',
            fontSize: 12,
            fontWeight: 600,
            fontFamily: 'Inter, sans-serif',
            cursor: 'pointer',
            boxShadow: '0 0 16px rgba(99,102,241,0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          Accept all
        </button>
      </div>
    </div>
  )
}
