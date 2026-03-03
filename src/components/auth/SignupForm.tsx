'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 8,
  color: '#F1F5F9',
  fontSize: 14,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 13,
  fontWeight: 500,
  color: '#94A3B8',
  fontFamily: 'Inter, sans-serif',
  marginBottom: 6,
}

export function SignupForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, onboarding_completed: false },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <div style={{
        borderRadius: 12,
        border: '1px solid rgba(99,102,241,0.3)',
        background: 'rgba(99,102,241,0.08)',
        padding: 24,
        textAlign: 'center',
        fontFamily: 'Inter, sans-serif',
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#F1F5F9', marginBottom: 8 }}>
          Check your email
        </h2>
        <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.6 }}>
          We sent a confirmation link to <strong style={{ color: '#C4B5FD' }}>{email}</strong>.
          Click the link to activate your account.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <label htmlFor="full-name" style={labelStyle}>Full name</label>
        <input
          id="full-name"
          type="text"
          placeholder="Jane Smith"
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="email" style={labelStyle}>Email</label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={inputStyle}
        />
      </div>

      <div>
        <label htmlFor="password" style={labelStyle}>Password</label>
        <input
          id="password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={6}
          style={inputStyle}
        />
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#F87171', fontFamily: 'Inter, sans-serif', margin: 0 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366F1, #8B5CF6)',
          color: '#FFFFFF',
          border: 'none',
          borderRadius: 10,
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'Inter, sans-serif',
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 0 24px rgba(99,102,241,0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          transition: 'all 0.2s ease',
        }}
      >
        {loading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }}/>}
        Create account
      </button>
    </form>
  )
}
