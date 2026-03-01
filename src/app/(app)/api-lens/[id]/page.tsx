import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ApiLensEditor } from '@/components/diagram/ApiLensEditor'

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

  return { title: data?.title ? `${data.title} — Flowmapr` : 'API Lens — Flowmapr' }
}

export default async function ApiLensPage({ params }: PageProps) {
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
    .select('generations_used, monthly_limit')
    .eq('user_id', user.id)
    .single()

  const generationsRemaining = sub ? sub.monthly_limit - sub.generations_used : 0

  const flowData = (diagram.flow_data ?? {}) as Record<string, unknown>
  const services = Array.isArray(flowData.services) ? flowData.services : []
  const connections = Array.isArray(flowData.connections) ? flowData.connections : []

  const metadata = (diagram.metadata ?? {}) as Record<string, unknown>
  const linkedC4 = {
    l1Id: (metadata.linked_c4_l1 as string) || null,
    l2Id: (metadata.linked_c4_l2 as string) || null,
  }

  return (
    <ApiLensEditor
      diagramId={diagram.id}
      initialTitle={diagram.title}
      services={services as Parameters<typeof ApiLensEditor>[0]['services']}
      connections={connections as Parameters<typeof ApiLensEditor>[0]['connections']}
      generationsRemaining={generationsRemaining}
      email={user.email ?? ''}
      fullName={(user.user_metadata?.full_name as string) ?? null}
      isPublic={diagram.is_public ?? false}
      publicSlug={diagram.public_slug ?? null}
      linkedC4={linkedC4}
    />
  )
}
