import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExplainImageShell } from '@/components/workspace/ExplainImageShell'

export const metadata = {
  title: 'Explain Image — Flowmapr',
}

export default async function WorkspaceExplainImagePage() {
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
    <ExplainImageShell
      email={email}
      fullName={fullName}
      plan={plan}
      generationsRemaining={generationsRemaining}
    />
  )
}
