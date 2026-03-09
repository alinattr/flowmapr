import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { DiagramCanvas } from '@/components/diagram/DiagramCanvas'
import { parseFlowData } from '@/lib/diagram'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('diagrams')
    .select('title')
    .eq('id', id)
    .single()

  return { title: data?.title ? `${data.title} — Flowmapr` : 'Diagram — Flowmapr' }
}

export default async function DiagramPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: diagram } = await supabase
    .from('diagrams')
    .select('*')
    .eq('id', id)
    .single()

  if (!diagram) notFound()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('generations_used, monthly_limit, plan')
    .eq('user_id', user.id)
    .single()

  const generationsRemaining = sub
    ? sub.monthly_limit - sub.generations_used
    : 0
  const userPlan = sub?.plan ?? 'free'

  const rawFlow = diagram.flow_data as { nodes?: unknown[]; edges?: unknown[] }
  const { nodes, edges } = parseFlowData(rawFlow as Parameters<typeof parseFlowData>[0])
  const email = user.email ?? ''
  const fullName = (user.user_metadata?.full_name as string) ?? null

  return (
    <DiagramCanvas
      diagramId={diagram.id}
      initialTitle={diagram.title}
      initialNodes={nodes}
      initialEdges={edges}
      diagramType={diagram.diagram_type}
      prompt={diagram.prompt ?? null}
      generationsRemaining={generationsRemaining}
      email={email}
      fullName={fullName}
      isPublic={diagram.is_public ?? false}
      publicSlug={diagram.public_slug ?? null}
      userPlan={userPlan}
      userId={user.id}
    />
  )
}
