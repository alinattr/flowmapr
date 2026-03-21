import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EmbedViewer } from '@/components/diagram/EmbedViewer'
import type { SequenceData } from '@/components/diagram/sequence/SequenceRenderer'
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

  const { data: diagram, error } = await supabase
    .from('diagrams')
    .select('id, title, flow_data, diagram_type, is_public, public_slug')
    .eq('public_slug', slug)
    .eq('is_public', true)
    .single()

  console.log('[share] slug:', slug)
  console.log('[share] error:', error)
  console.log('[share] diagram:', JSON.stringify(diagram))
  console.log(
    '[share] flow_data keys:',
    diagram?.flow_data ? Object.keys(diagram.flow_data as object) : 'null'
  )

  if (!diagram) notFound()

  const flowData = (diagram.flow_data ?? {}) as Record<string, unknown>
  const isSequence = diagram.diagram_type === 'SEQUENCE'

  let sequenceData: SequenceData | null = null
  let reactFlowNodes: unknown[] = []
  let reactFlowEdges: unknown[] = []

  if (isSequence) {
    sequenceData = {
      title: (flowData.title as string) ?? diagram.title,
      participants: Array.isArray(flowData.participants)
        ? (flowData.participants as SequenceData['participants'])
        : [],
      messages: Array.isArray(flowData.messages)
        ? (flowData.messages as SequenceData['messages'])
        : [],
      fragments: Array.isArray(flowData.fragments)
        ? (flowData.fragments as SequenceData['fragments'])
        : [],
    }
  } else {
    const parsed = parseFlowData(
      flowData as Parameters<typeof parseFlowData>[0]
    )
    reactFlowNodes = parsed.nodes
    reactFlowEdges = parsed.edges
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--color-accent-brand)]"
          >
            Flowmapr
          </Link>
          <div className="h-4 w-px bg-[var(--color-border)]" />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {diagram.title}
          </span>
          <span className="rounded-full bg-[var(--color-accent-subtle)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
            Read-only
          </span>
        </div>
        <Link
          href="/signup"
          className="rounded-md bg-[var(--color-accent-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          Create your own
        </Link>
      </header>

      <div className="min-h-0 flex-1 overflow-auto">
        <EmbedViewer
          title={diagram.title}
          diagramType={diagram.diagram_type}
          sequenceData={sequenceData}
          nodes={reactFlowNodes}
          edges={reactFlowEdges}
        />
      </div>
    </div>
  )
}
