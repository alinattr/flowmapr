import { createAdminClient } from '@/lib/supabase/admin'
import { EmbedViewer } from '@/components/diagram/EmbedViewer'
import type { SequenceData } from '@/components/diagram/sequence/SequenceRenderer'
import { parseFlowData } from '@/lib/diagram'

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
          color: '#A1A1AA',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
        }}
      >
        This diagram is not available.
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
    <div style={{ width: '100%', height: '100vh', background: '#09090B' }}>
      <EmbedViewer
        title={diagram.title}
        diagramType={diagram.diagram_type}
        sequenceData={sequenceData}
        nodes={reactFlowNodes}
        edges={reactFlowEdges}
      />
    </div>
  )
}
