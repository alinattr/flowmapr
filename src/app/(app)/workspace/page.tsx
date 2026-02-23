import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'

export const metadata = {
  title: 'Workspace — Flowmapr',
}

export default async function WorkspacePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const email = user.email ?? ''
  const fullName = (user.user_metadata?.full_name as string) ?? null

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, generations_used, monthly_limit')
    .eq('user_id', user.id)
    .single()

  const plan = sub?.plan ?? 'free_trial'
  const generationsRemaining = sub
    ? sub.monthly_limit - sub.generations_used
    : 2

  const { data: diagrams } = await supabase
    .from('diagrams')
    .select('id, title, diagram_type, updated_at, created_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  return (
    <WorkspaceShell
      email={email}
      fullName={fullName}
      generationsRemaining={generationsRemaining}
      plan={plan}
      diagrams={diagrams ?? []}
    />
  )
}
