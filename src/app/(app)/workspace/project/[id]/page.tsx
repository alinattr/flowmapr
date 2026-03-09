import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ProjectShell } from '@/components/workspace/ProjectShell'
import { generatePreviewFromFlowData } from '@/lib/diagram/generatePreviewSvg'
import type { DiagramSummary } from '@/types/diagram'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('projects').select('name').eq('id', id).single()
  return { title: data ? `${data.name} — Flowmapr` : 'Project — Flowmapr' }
}

export default async function ProjectPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!project) notFound()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, generations_used, monthly_limit')
    .eq('user_id', user.id)
    .single()

  const profileRes = await supabase
    .from('profiles')
    .select('onboarding_completed')
    .eq('id', user.id)
    .maybeSingle()
  // Show onboarding only when not completed.
  // If profile row/column is missing, treat as first login and show onboarding.
  const needsOnboarding =
    Boolean(profileRes.error) || !Boolean(profileRes.data?.onboarding_completed)

  const plan = sub?.plan ?? 'free'
  const generationsRemaining = sub ? sub.monthly_limit - sub.generations_used : 2

  const { data: rawDiagrams } = await supabase
    .from('diagrams')
    .select('id, title, diagram_type, updated_at, created_at, preview_svg, folder_id, public_slug, project_id, flow_data')
    .eq('project_id', id)
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

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
      id: d.id, title: d.title, diagram_type: d.diagram_type,
      updated_at: d.updated_at, created_at: d.created_at,
      preview_svg: svg, folder_id: d.folder_id ?? null,
      public_slug: d.public_slug ?? null, project_id: d.project_id ?? null,
      // Pass flow_data for API Lens cards so the preview can show service names
      ...(d.diagram_type === 'api_lens' ? { flow_data: d.flow_data as Record<string, unknown> ?? null } : {}),
    } as DiagramSummary
  })

  return (
    <ProjectShell
      email={user.email ?? ''}
      fullName={(user.user_metadata?.full_name as string) ?? null}
      generationsRemaining={generationsRemaining}
      plan={plan}
      project={project}
      diagrams={diagrams}
      needsOnboarding={needsOnboarding}
    />
  )
}
