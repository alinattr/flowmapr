'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Logo } from '@/components/shared/LogoIcon'
import { CodeRain } from '@/components/landing/CodeRain'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#F1F5F9',
  fontSize: 14,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit() {
    if (!email) return
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
    } else {
      setSent(true)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#09090B',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Inter, sans-serif',
      position: 'relative',
    }}>
      <CodeRain />

      <div style={{
        width: '100%',
        maxWidth: 400,
        padding: '0 24px',
        position: 'relative',
        zIndex: 1,
      }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '36px 32px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 60px rgba(99,102,241,0.08)',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
            <a href="/" style={{ textDecoration: 'none' }}>
              <Logo size={32} />
            </a>
          </div>

          {sent ? (
            /* Success state */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 52, height: 52,
                borderRadius: 14,
                background: 'rgba(34,197,94,0.12)',
                border: '1px solid rgba(34,197,94,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24,
                margin: '0 auto 16px',
              }}>
                ✉️
              </div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px' }}>
                Check your email
              </h1>
              <p style={{ fontSize: 13, color: '#71717A', lineHeight: 1.6, marginBottom: 24 }}>
                We sent a password reset link to<br />
                <span style={{ color: '#94A3B8', fontWeight: 500 }}>{email}</span>
              </p>
              <p style={{ fontSize: 12, color: '#52525B', marginBottom: 20 }}>
                Didn&apos;t receive it? Check your spam folder or{' '}
                <button
                  onClick={() => setSent(false)}
                  style={{
                    background: 'none', border: 'none',
                    color: '#818CF8', cursor: 'pointer',
                    fontSize: 12, padding: 0,
                    textDecoration: 'underline', fontFamily: 'Inter, sans-serif',
                  }}
                >
                  try again
                </button>
              </p>
              <a
                href="/login"
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '10px',
                  borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#94A3B8',
                  fontSize: 13,
                  textDecoration: 'none',
                  fontFamily: 'Inter, sans-serif',
                }}
              >
                ← Back to login
              </a>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 style={{
                fontSize: 22, fontWeight: 700,
                color: '#F8FAFC', margin: '0 0 8px',
                textAlign: 'center',
              }}>
                Reset your password
              </h1>
              <p style={{
                fontSize: 13, color: '#71717A',
                textAlign: 'center', marginBottom: 24, lineHeight: 1.5,
              }}>
                Enter your email and we&apos;ll send you a reset link
              </p>

              {error && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.2)',
                  borderRadius: 8,
                  color: '#FCA5A5',
                  fontSize: 12,
                  marginBottom: 16,
                  fontFamily: 'Inter, sans-serif',
                }}>
                  {error}
                </div>
              )}

              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 13, color: '#94A3B8', display: 'block', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  placeholder="you@example.com"
                  style={inputStyle}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={loading || !email}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: loading || !email
                    ? 'rgba(99,102,241,0.4)'
                    : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  border: 'none',
                  borderRadius: 10,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  cursor: loading || !email ? 'not-allowed' : 'pointer',
                  boxShadow: loading || !email ? 'none' : '0 0 20px rgba(99,102,241,0.3)',
                  marginBottom: 16,
                }}
              >
                {loading ? 'Sending…' : 'Send reset link'}
              </button>

              <div style={{ textAlign: 'center' }}>
                <a href="/login" style={{
                  fontSize: 13, color: '#52525B',
                  textDecoration: 'none', fontFamily: 'Inter, sans-serif',
                }}>
                  ← Back to login
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
