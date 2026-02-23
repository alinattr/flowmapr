import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { ReadOnlyCanvas } from '@/components/diagram/ReadOnlyCanvas'
import { parseFlowData } from '@/lib/diagram'

interface PageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('diagrams')
    .select('title')
    .eq('public_slug', slug)
    .eq('is_public', true)
    .single()

  return {
    title: data?.title ? `${data.title} — Flowmapr` : 'Shared Diagram — Flowmapr',
  }
}

export default async function SharePage({ params }: PageProps) {
  const { slug } = await params
  const supabase = createAdminClient()

  const { data: diagram } = await supabase
    .from('diagrams')
    .select('id, title, flow_data, diagram_type')
    .eq('public_slug', slug)
    .eq('is_public', true)
    .single()

  if (!diagram) notFound()

  const rawFlow = diagram.flow_data as { nodes?: unknown[]; edges?: unknown[] }
  const { nodes, edges } = parseFlowData(rawFlow as Parameters<typeof parseFlowData>[0])

  return (
    <ReadOnlyCanvas
      title={diagram.title}
      nodes={nodes}
      edges={edges}
    />
  )
}
