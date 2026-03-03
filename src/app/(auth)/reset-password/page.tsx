'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/shared/LogoIcon'
import { CodeRain } from '@/components/landing/CodeRain'

const baseInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 40px 10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8,
  color: '#F1F5F9',
  fontSize: 14,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

const toggleBtnStyle: React.CSSProperties = {
  position: 'absolute',
  right: 12,
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  color: '#52525B',
  padding: 0,
  display: 'flex',
  alignItems: 'center',
}

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleReset() {
    if (!password || password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setLoading(false)
      setError(error.message)
      return
    }

    // Sign out the recovery session so the user must log in fresh
    await supabase.auth.signOut()
    setLoading(false)
    setDone(true)
    setTimeout(() => router.push('/login'), 2500)
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
            <Logo size={32} />
          </div>

          {done ? (
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
                ✓
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: '#F8FAFC', margin: '0 0 8px' }}>
                Password updated!
              </h2>
              <p style={{ fontSize: 13, color: '#71717A', margin: 0 }}>
                Please log in with your new password.
              </p>
            </div>
          ) : (
            /* Form state */
            <>
              <h1 style={{
                fontSize: 22, fontWeight: 700,
                color: '#F8FAFC', margin: '0 0 8px',
                textAlign: 'center',
              }}>
                Set new password
              </h1>
              <p style={{
                fontSize: 13, color: '#71717A',
                textAlign: 'center', marginBottom: 24, lineHeight: 1.5,
              }}>
                Choose a strong password for your account
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

              {/* New password */}
              <div style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 13, color: '#94A3B8', display: 'block', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
                  New password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    style={baseInputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={toggleBtnStyle}
                    tabIndex={-1}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 13, color: '#94A3B8', display: 'block', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>
                  Confirm password
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleReset()}
                    placeholder="Repeat your password"
                    style={{
                      ...baseInputStyle,
                      border: confirm && confirm !== password
                        ? '1px solid rgba(239,68,68,0.4)'
                        : '1px solid rgba(255,255,255,0.1)',
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(v => !v)}
                    style={toggleBtnStyle}
                    tabIndex={-1}
                  >
                    <EyeIcon open={showConfirm} />
                  </button>
                </div>
              </div>

              <button
                onClick={handleReset}
                disabled={loading || !password || !confirm}
                style={{
                  width: '100%',
                  padding: '11px',
                  background: loading || !password || !confirm
                    ? 'rgba(99,102,241,0.4)'
                    : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  border: 'none',
                  borderRadius: 10,
                  color: 'white',
                  fontSize: 14,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  cursor: loading || !password || !confirm ? 'not-allowed' : 'pointer',
                  boxShadow: loading || !password || !confirm ? 'none' : '0 0 20px rgba(99,102,241,0.3)',
                }}
              >
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
