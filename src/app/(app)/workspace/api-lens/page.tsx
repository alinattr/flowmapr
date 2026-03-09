import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiLensLandingShell } from '@/components/workspace/ApiLensLandingShell'
import { hasFeature } from '@/lib/subscriptions/hasFeature'

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
    .select('plan, status, generations_used, monthly_limit')
    .eq('user_id', user.id)
    .maybeSingle()

  const plan = sub?.plan ?? 'free'
  const generationsRemaining = sub ? sub.monthly_limit - sub.generations_used : 3
  const canUseApiLens = await hasFeature(user.id, 'api_lens')

  return (
    <ApiLensLandingShell
      email={email}
      fullName={fullName}
      generationsRemaining={generationsRemaining}
      plan={plan}
      locked={!canUseApiLens}
    />
  )
}
