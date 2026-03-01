'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 50,
        background: scrolled ? 'rgba(9,9,11,0.85)' : 'rgba(9,9,11,0.5)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: scrolled
          ? '0 4px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
          : '0 1px 40px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.04)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Top gradient highlight */}
      <div
        style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.4), rgba(167,139,250,0.4), transparent)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          maxWidth: 1100, margin: '0 auto', padding: '0 24px',
          height: 60, display: 'flex', alignItems: 'center', gap: 32,
        }}
      >
        <Link href="/" style={{
          fontSize: 18, fontWeight: 800, fontFamily: 'Inter, sans-serif',
          background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          textDecoration: 'none', letterSpacing: '-0.02em',
        }}>
          flowmapr
        </Link>

        <div style={{ display: 'flex', gap: 24, marginLeft: 8 }}>
          {['Features', 'Pricing', 'FAQ'].map(item => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              style={{ fontSize: 14, color: '#94A3B8', textDecoration: 'none', fontFamily: 'Inter, sans-serif', transition: 'color 0.15s ease' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#E2E8F0')}
              onMouseLeave={e => (e.currentTarget.style.color = '#94A3B8')}
            >
              {item}
            </a>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <Link href="/login" style={{ fontSize: 14, color: '#94A3B8', textDecoration: 'none', fontFamily: 'Inter, sans-serif', transition: 'color 0.15s ease' }}>
          Sign in
        </Link>
        <Link href="/signup" style={{
          padding: '8px 18px',
          background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          borderRadius: 8, fontSize: 14, fontWeight: 600,
          color: 'white', textDecoration: 'none', fontFamily: 'Inter, sans-serif',
          boxShadow: '0 0 20px rgba(99,102,241,0.3)', transition: 'all 0.2s ease',
        }}>
          Get started
        </Link>
      </div>
    </nav>
  )
}
