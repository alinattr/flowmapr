import { createAdminClient } from '@/lib/supabase/admin'
import { notFound } from 'next/navigation'
import { EmbedViewer } from '@/components/diagram/EmbedViewer'
import type { SequenceData } from '@/components/diagram/sequence/SequenceRenderer'
import { parseFlowData } from '@/lib/diagram'
import Link from 'next/link'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('diagrams')
    .select('title')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  return {
    title: data?.title ? `${data.title} — Flowmapr` : 'Flowmapr Diagram',
  }
}

export default async function EmbedPage({ params }: PageProps) {
  const { id } = await params
  const supabase = createAdminClient()

  const { data: diagram } = await supabase
    .from('diagrams')
    .select('id, title, flow_data, diagram_type, is_public')
    .eq('id', id)
    .eq('is_public', true)
    .single()

  if (!diagram) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#09090B',
          color: '#52525B',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          flexDirection: 'column',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 32 }}>—</span>
        <span>Diagram not found or not public</span>
      </div>
    )
  }

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
    <div style={{ width: '100%', height: '100vh', background: '#09090B', position: 'relative' }}>
      <EmbedViewer
        title={diagram.title}
        diagramType={diagram.diagram_type}
        sequenceData={sequenceData}
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
      />

      <Link
        href="https://flowmapr.com"
        target="_blank"
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6,
          textDecoration: 'none',
          fontSize: 11,
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'Inter, sans-serif',
          zIndex: 999,
          backdropFilter: 'blur(8px)',
        }}
      >
        Made with flowmapr
      </Link>
    </div>
  )
}
