import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { WorkspaceShell } from '@/components/workspace/WorkspaceShell'
import { generatePreviewFromFlowData } from '@/lib/diagram/generatePreviewSvg'
import type { DiagramSummary, Folder } from '@/types/diagram'

export const metadata = {
  title: 'Workspace — Flowmapr',
}

export default async function WorkspacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const email = user.email ?? ''
  const fullName = (user.user_metadata?.full_name as string) ?? null
  const onboardingCompleted = (user.user_metadata?.onboarding_completed as boolean | undefined) ?? true

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, generations_used, monthly_limit')
    .eq('user_id', user.id)
    .single()

  const plan = sub?.plan ?? 'free_trial'
  const generationsRemaining = sub ? sub.monthly_limit - sub.generations_used : 2

  const { data: rawDiagrams } = await supabase
    .from('diagrams')
    .select('id, title, diagram_type, updated_at, created_at, preview_svg, folder_id, public_slug, flow_data')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  const { data: rawFolders } = await supabase
    .from('folders')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  // Generate missing previews on the fly and persist them
  const diagrams: DiagramSummary[] = (rawDiagrams ?? []).map(d => {
    let svg = d.preview_svg
      ? d.preview_svg.replace(/<rect[^>]+fill="#0d0d10"[^>]*\/>/gi, '')
      : null

    if (!svg && d.flow_data) {
      svg = generatePreviewFromFlowData(d.diagram_type, d.flow_data as Record<string, unknown>) || null
      if (svg) {
        supabase.from('diagrams').update({ preview_svg: svg }).eq('id', d.id).then(() => {})
      }
    }

    return {
      id: d.id,
      title: d.title,
      diagram_type: d.diagram_type,
      updated_at: d.updated_at,
      created_at: d.created_at,
      preview_svg: svg,
      folder_id: d.folder_id,
      public_slug: d.public_slug,
    } as DiagramSummary
  })

  // Skip onboarding for users who already have diagrams (existing accounts)
  const diagramCount = rawDiagrams?.length ?? 0
  const needsOnboarding = !onboardingCompleted && diagramCount === 0

  return (
    <WorkspaceShell
      email={email}
      fullName={fullName}
      generationsRemaining={generationsRemaining}
      plan={plan}
      diagrams={diagrams}
      folders={(rawFolders ?? []) as Folder[]}
      needsOnboarding={needsOnboarding}
    />
  )
}
