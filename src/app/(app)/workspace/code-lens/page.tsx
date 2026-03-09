import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CodeLensShell } from '@/components/workspace/CodeLensShell'
import { hasFeature } from '@/lib/subscriptions/hasFeature'

export const metadata = {
  title: 'Code Lens — Flowmapr',
}

export default async function WorkspaceCodeLensPage() {
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

  const plan = sub?.plan ?? 'free'
  const generationsRemaining = sub ? sub.monthly_limit - sub.generations_used : 2
  const canUseCodeLens = await hasFeature(user.id, 'code_lens')

  return (
    <CodeLensShell
      email={email}
      fullName={fullName}
      generationsRemaining={generationsRemaining}
      plan={plan}
      forceLocked={!canUseCodeLens}
    />
  )
}
