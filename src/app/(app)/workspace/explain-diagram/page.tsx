import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ExplainDiagramShell } from '@/components/workspace/ExplainDiagramShell'

export const metadata = {
  title: 'Explain Diagram — Flowmapr',
}

export default async function WorkspaceExplainDiagramPage() {
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

  return (
    <ExplainDiagramShell
      email={email}
      fullName={fullName}
      plan={plan}
      generationsRemaining={generationsRemaining}
    />
  )
}
