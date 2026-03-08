import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiLensLandingShell } from '@/components/workspace/ApiLensLandingShell'

export const metadata = {
  title: 'API Lens — Flowmapr',
}

export default async function WorkspaceApiLensPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = user.email ?? ''
  const fullName = (user.user_metadata?.full_name as string) ?? null

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, generations_used, monthly_limit')
    .eq('user_id', user.id)
    .single()

  const plan = sub?.plan ?? 'free_trial'
  const generationsRemaining = sub ? sub.monthly_limit - sub.generations_used : 2

  return (
    <ApiLensLandingShell
      email={email}
      fullName={fullName}
      generationsRemaining={generationsRemaining}
      plan={plan}
    />
  )
}
