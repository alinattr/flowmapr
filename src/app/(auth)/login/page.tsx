import { LoginForm } from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Log in — Flowmapr',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
      <div className="w-full max-w-sm space-y-6 px-4">
        <div className="space-y-2 text-center">
          <h1
            className="text-[30px] font-semibold tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Welcome back
          </h1>
          <p
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Log in to your Flowmapr account
          </p>
        </div>
        <LoginForm />
        <p
          className="text-center text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Don&apos;t have an account?{' '}
          <a
            href="/signup"
            className="font-medium"
            style={{ color: 'var(--color-accent)' }}
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  )
}
