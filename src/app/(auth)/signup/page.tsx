import { SignupForm } from '@/components/auth/SignupForm'

export const metadata = {
  title: 'Sign up — Flowmapr',
}

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-2 text-center">
          <h1
            className="text-[30px] font-semibold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Create your account
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Try free — no credit card required
          </p>
        </div>
        <SignupForm />
        <p
          className="text-center text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Already have an account?{' '}
          <a
            href="/login"
            className="font-medium"
            style={{ color: 'var(--color-accent)' }}
          >
            Log in
          </a>
        </p>
      </div>
    </div>
  )
}
