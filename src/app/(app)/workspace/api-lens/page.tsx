import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { ApiLensLandingShell } from '@/components/workspace/ApiLensLandingShell'
import type { DiagramSummary, Folder } from '@/types/diagram'

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

  const { data: rawDiagrams } = await supabase
    .from('diagrams')
    .select('id, title, diagram_type, updated_at, created_at, preview_svg, folder_id, public_slug')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const { data: rawFolders } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  return (
    <ApiLensLandingShell
      email={email}
      fullName={fullName}
      generationsRemaining={generationsRemaining}
      plan={plan}
      diagrams={(rawDiagrams ?? []) as DiagramSummary[]}
      folders={(rawFolders ?? []) as Folder[]}
    />
  )
}
