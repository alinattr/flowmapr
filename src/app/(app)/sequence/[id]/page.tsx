import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { SequenceEditor } from '@/components/diagram/sequence/SequenceEditor'
import type { SequenceData } from '@/components/diagram/sequence/SequenceRenderer'

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

  return { title: data?.title ? `${data.title} — Flowmapr` : 'Sequence Diagram — Flowmapr' }
}

export default async function SequencePage({ params }: PageProps) {
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

  const sequenceData: SequenceData = {
    title: (flowData.title as string) ?? diagram.title,
    participants: Array.isArray(flowData.participants) ? flowData.participants as SequenceData['participants'] : [],
    messages: Array.isArray(flowData.messages) ? flowData.messages as SequenceData['messages'] : [],
    fragments: Array.isArray(flowData.fragments) ? flowData.fragments as SequenceData['fragments'] : [],
  }

  return (
    <SequenceEditor
      diagramId={diagram.id}
      initialTitle={diagram.title}
      sequenceData={sequenceData}
      initialPrompt={(diagram.prompt as string) ?? ''}
      generationsRemaining={generationsRemaining}
      email={user.email ?? ''}
      fullName={(user.user_metadata?.full_name as string) ?? null}
      isPublic={diagram.is_public ?? false}
      publicSlug={diagram.public_slug ?? null}
    />
  )
}
