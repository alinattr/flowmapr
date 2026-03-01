import { SignupForm } from '@/components/auth/SignupForm'
import { CodeRain } from '@/components/landing/CodeRain'

export const metadata = {
  title: 'Sign up — Flowmapr',
}

export default function SignupPage() {
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
        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16,
          padding: '36px 32px',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 60px rgba(99,102,241,0.08)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 20,
            }}>
              {/* Logo mark */}
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, fontWeight: 700, color: '#fff',
              }}>F</div>
              <span style={{ fontSize: 16, fontWeight: 700, color: '#F1F5F9' }}>Flowmapr</span>
            </div>
            <h1 style={{
              fontSize: 24, fontWeight: 700,
              color: '#F8FAFC', margin: '0 0 6px',
            }}>
              Create your account
            </h1>
            <p style={{ fontSize: 13, color: '#71717A', margin: 0 }}>
              Try free — no credit card required
            </p>
          </div>

          <SignupForm />
        </div>

        {/* Footer link */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13 }}>
          <span style={{ color: '#52525B' }}>Already have an account? </span>
          <a
            href="/login"
            style={{
              color: '#818CF8',
              fontWeight: 500,
              textDecoration: 'none',
              borderBottom: '1px solid rgba(99,102,241,0.3)',
            }}
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  )
}
