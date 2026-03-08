'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  ReactFlow, Background, Controls,
  useNodesState, useEdgesState,
  type Node, type Edge, type NodeChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ApiLensC4Node } from './nodes/api-lens/ApiLensC4Node'
import { EndpointPanel } from './EndpointPanel'
import { downloadOpenApi } from '@/lib/diagram/exportOpenApi'
import { downloadMarkdown } from '@/lib/diagram/exportMarkdown'
import { createClient } from '@/lib/supabase/client'

const nodeTypes = { apiLensC4: ApiLensC4Node }

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiEndpoint {
  id: string
  method: string
  path: string
  summary: string
  description?: string
  tags?: string[]
  parameters?: Array<{ name: string; in: string; required: boolean; type: string; description?: string }>
  requestBody?: { contentType: string; schema: string } | null
  responses?: Array<{ status: number; description: string; schema?: string | null }>
}

interface ApiService {
  id: string
  name: string
  kind?: string
  technology?: string | null
  endpoints: ApiEndpoint[]
  position: { x: number; y: number }
}

type Connection = { id: string; source: string; target: string; label: string }

type ApiLensView = 'c4_l1' | 'c4_l2'

interface ApiLensShellProps {
  services: ApiService[]
  connections: Connection[]
  diagramTitle?: string
  linkedC4?: { l1Id: string | null; l2Id: string | null }
  onEditSpec?: () => void
  /** Supabase diagram ID — enables drag-position persistence */
  diagramId?: string
}

// ─── C4 L1 node builder (system context view) ─────────────────────────────────

function buildC4L1(
  services: ApiService[],
  connections: Connection[],
): { nodes: Node[]; edges: Edge[] } {
  const builtNodes: Node[] = []
  const builtEdges: Edge[] = []

  const appSvcs = services.filter(s => s.kind !== 'external' && s.kind !== 'database' && s.kind !== 'cache')
  const dbSvcs = services.filter(s => s.kind === 'database' || s.kind === 'cache')
  const externalSvcs = services.filter(s => s.kind === 'external')

  // Person node
  builtNodes.push({
    id: '__person',
    type: 'apiLensC4',
    position: { x: 100, y: 40 },
    data: {
      variant: 'person',
      label: 'Client',
      stereotype: 'Person',
      description: 'End user of the application',
    },
  })

  // Gateway / first app service as entry point
  const gatewayOrFirst = services.find(s => s.kind === 'gateway') ?? appSvcs[0]
  if (gatewayOrFirst) {
    builtNodes.push({
      id: '__entry',
      type: 'apiLensC4',
      position: { x: 100, y: 220 },
      data: {
        variant: 'internal',
        label: gatewayOrFirst.name,
        stereotype: gatewayOrFirst.technology ? `Container: ${gatewayOrFirst.technology}` : 'Software System',
        description: `${gatewayOrFirst.endpoints.length} endpoint${gatewayOrFirst.endpoints.length !== 1 ? 's' : ''}`,
      },
    })
    builtEdges.push({
      id: '__person-entry',
      source: '__person',
      target: '__entry',
      label: 'Uses',
      type: 'smoothstep',
      style: { stroke: 'rgba(99,102,241,0.45)', strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: '#64748B', fontFamily: 'Inter' },
      markerEnd: { type: 'arrowclosed', width: 14, height: 14, color: 'rgba(99,102,241,0.5)' },
    } as Edge)
  }

  // Remaining app services in a grid
  const remainingApp = appSvcs.filter(s => s.id !== gatewayOrFirst?.id)
  remainingApp.forEach((svc, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    builtNodes.push({
      id: svc.id,
      type: 'apiLensC4',
      position: { x: 340 + col * 220, y: 120 + row * 180 },
      data: {
        variant: 'internal',
        label: svc.name,
        stereotype: svc.technology ? `Container: ${svc.technology}` : 'Software System',
        description: svc.endpoints.slice(0, 2).map(e => `${e.method} ${e.path}`).join('\n') || '',
      },
    })
    if (gatewayOrFirst) {
      builtEdges.push({
        id: `__entry-${svc.id}`,
        source: '__entry',
        target: svc.id,
        label: 'Calls',
        type: 'smoothstep',
        style: { stroke: 'rgba(99,102,241,0.35)', strokeWidth: 1.5 },
        labelStyle: { fontSize: 10, fill: '#64748B', fontFamily: 'Inter' },
        markerEnd: { type: 'arrowclosed', width: 12, height: 12, color: 'rgba(99,102,241,0.45)' },
      } as Edge)
    }
  })

  // Database / cache nodes
  dbSvcs.forEach((svc, i) => {
    const rows = Math.ceil(remainingApp.length / 3)
    builtNodes.push({
      id: svc.id,
      type: 'apiLensC4',
      position: { x: 340 + i * 220, y: 120 + rows * 180 + 60 },
      data: {
        variant: 'internal',
        label: svc.name,
        stereotype: svc.kind === 'cache' ? 'Container: Cache' : 'Container: Database',
        description: `${svc.endpoints.length} operation${svc.endpoints.length !== 1 ? 's' : ''}`,
      },
    })
    const connectFrom = remainingApp[0]?.id ?? '__entry'
    if (connectFrom) {
      builtEdges.push({
        id: `__app-${svc.id}`,
        source: connectFrom,
        target: svc.id,
        label: 'Reads/Writes',
        type: 'smoothstep',
        style: { stroke: 'rgba(59,130,246,0.4)', strokeWidth: 1.5 },
        labelStyle: { fontSize: 10, fill: '#64748B', fontFamily: 'Inter' },
        markerEnd: { type: 'arrowclosed', width: 12, height: 12, color: 'rgba(59,130,246,0.45)' },
      } as Edge)
    }
  })

  // External systems
  externalSvcs.forEach((svc, i) => {
    builtNodes.push({
      id: svc.id,
      type: 'apiLensC4',
      position: { x: 820, y: 180 + i * 200 },
      data: {
        variant: 'external',
        label: svc.name,
        stereotype: svc.technology ? `External: ${svc.technology}` : 'External System',
        description: `${svc.endpoints.length} endpoint${svc.endpoints.length !== 1 ? 's' : ''}`,
      },
    })
  })

  // Map explicit connections
  const existingIds = new Set(builtNodes.map(n => n.id))
  connections.forEach(c => {
    if (!existingIds.has(c.source) || !existingIds.has(c.target)) return
    const isExternal = services.find(s => s.id === c.source)?.kind === 'external'
    builtEdges.push({
      id: `conn-${c.id}`,
      source: c.source,
      target: c.target,
      label: c.label,
      type: 'smoothstep',
      style: { stroke: isExternal ? 'rgba(100,116,139,0.45)' : 'rgba(99,102,241,0.35)', strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: '#64748B', fontFamily: 'Inter' },
      markerEnd: { type: 'arrowclosed', width: 12, height: 12, color: isExternal ? 'rgba(100,116,139,0.5)' : 'rgba(99,102,241,0.45)' },
    } as Edge)
  })

  // Deduplicate edges
  const seen = new Set<string>()
  const dedupedEdges = builtEdges.filter(e => {
    const key = `${e.source}-${e.target}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { nodes: builtNodes, edges: dedupedEdges }
}

// ─── C4 L2 node builder (container detail view) ───────────────────────────────

function buildC4L2(
  services: ApiService[],
  connections: Connection[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const idMap: Record<string, string> = {}

  services.forEach((svc, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const nodeId = `c4l2-${svc.id}`
    idMap[svc.id] = nodeId

    const isExternal = svc.kind === 'external'
    const isDb = svc.kind === 'database' || svc.kind === 'cache'

    nodes.push({
      id: nodeId,
      type: 'apiLensC4',
      position: { x: 80 + col * 280, y: 60 + row * 200 },
      data: {
        variant: isExternal ? 'external' : 'internal',
        label: svc.name,
        stereotype: svc.technology
          ? (isDb ? `Database: ${svc.technology}` : `Container: ${svc.technology}`)
          : isDb ? 'Database' : isExternal ? 'External System' : 'Container',
        description: `${svc.endpoints.length} endpoint${svc.endpoints.length !== 1 ? 's' : ''}`,
      },
    })
  })

  connections.forEach(c => {
    const src = idMap[c.source]
    const tgt = idMap[c.target]
    if (!src || !tgt) return
    const isExternal = services.find(s => s.id === c.source)?.kind === 'external'
    edges.push({
      id: `c4l2-edge-${c.id}`,
      source: src,
      target: tgt,
      label: c.label,
      type: 'smoothstep',
      style: { stroke: isExternal ? 'rgba(100,116,139,0.45)' : 'rgba(99,102,241,0.35)', strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: '#64748B', fontFamily: 'Inter' },
      markerEnd: { type: 'arrowclosed', width: 12, height: 12, color: isExternal ? 'rgba(100,116,139,0.5)' : 'rgba(99,102,241,0.45)' },
    } as Edge)
  })

  return { nodes, edges }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ApiLensShell({
  services,
  connections,
  diagramTitle = 'API Documentation',
  onEditSpec,
  diagramId,
}: ApiLensShellProps) {
  const [selectedService, setSelectedService] = useState<ApiService | null>(null)
  const [currentView, setCurrentView] = useState<ApiLensView>('c4_l1')

  // Compute initial node/edge sets once at mount
  const initRef = useRef<{
    l1: { nodes: Node[]; edges: Edge[] }
    l2: { nodes: Node[]; edges: Edge[] }
  } | null>(null)
  if (!initRef.current) {
    initRef.current = {
      l1: buildC4L1(services, connections),
      l2: buildC4L2(services, connections),
    }
  }

  // Per-view node/edge state — positions persist independently across view switches
  const [c4l1Nodes, setC4l1Nodes, onC4l1NodesChange] = useNodesState<Node>(initRef.current.l1.nodes)
  const [c4l1Edges, setC4l1Edges, onC4l1EdgesChange] = useEdgesState<Edge>(initRef.current.l1.edges)
  const [c4l2Nodes, setC4l2Nodes, onC4l2NodesChange] = useNodesState<Node>(initRef.current.l2.nodes)
  const [c4l2Edges, setC4l2Edges, onC4l2EdgesChange] = useEdgesState<Edge>(initRef.current.l2.edges)

  // Rebuild both views when services change (after re-analyse in parent)
  const prevServicesRef = useRef(services)
  useEffect(() => {
    if (prevServicesRef.current === services) return
    prevServicesRef.current = services
    const l1 = buildC4L1(services, connections)
    setC4l1Nodes(l1.nodes)
    setC4l1Edges(l1.edges)
    const l2 = buildC4L2(services, connections)
    setC4l2Nodes(l2.nodes)
    setC4l2Edges(l2.edges)
  }, [services, connections, setC4l1Nodes, setC4l1Edges, setC4l2Nodes, setC4l2Edges])

  // Active state for current view
  const nodes = currentView === 'c4_l1' ? c4l1Nodes : c4l2Nodes
  const edges = currentView === 'c4_l1' ? c4l1Edges : c4l2Edges
  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      if (currentView === 'c4_l1') onC4l1NodesChange(changes as NodeChange<Node>[])
      else onC4l2NodesChange(changes as NodeChange<Node>[])
    },
    [currentView, onC4l1NodesChange, onC4l2NodesChange],
  )

  // Save node positions to Supabase after drag
  const savedPositionsRef = useRef<{ c4l1: Record<string, { x: number; y: number }>; c4l2: Record<string, { x: number; y: number }> }>({ c4l1: {}, c4l2: {} })

  const handleNodeDragStop = useCallback(() => {
    if (!diagramId) return
    const activeNodes = currentView === 'c4_l1' ? c4l1Nodes : c4l2Nodes
    const positions: Record<string, { x: number; y: number }> = {}
    activeNodes.forEach(n => { positions[n.id] = n.position })
    if (currentView === 'c4_l1') savedPositionsRef.current.c4l1 = positions
    else savedPositionsRef.current.c4l2 = positions

    const supabase = createClient()
    supabase.from('diagrams').update({
      flow_data: {
        services,
        connections,
        c4l1_positions: savedPositionsRef.current.c4l1,
        c4l2_positions: savedPositionsRef.current.c4l2,
      },
    }).eq('id', diagramId).then(() => {})
  }, [diagramId, currentView, c4l1Nodes, c4l2Nodes, services, connections])

  // Node click — select service for endpoint panel
  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    // C4 L2 node IDs are `c4l2-${svc.id}` — strip prefix to find service
    const rawId = node.id.startsWith('c4l2-') ? node.id.slice(5) : node.id
    const svc = services.find(s => s.id === rawId)
    setSelectedService(svc ?? null)
  }, [services])

  const allEndpoints = services.flatMap(s => s.endpoints)

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>

      {/* ── Left: endpoint list ─────────────────────────────────────────────── */}
      <div style={{
        width: 260, height: '100%', overflow: 'auto', flexShrink: 0,
        background: 'var(--color-bg-secondary, rgba(9,9,11,0.95))',
        borderRight: '1px solid var(--color-border, rgba(255,255,255,0.06))',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Toolbar */}
        <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.06))', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {onEditSpec && (
            <button
              onClick={onEditSpec}
              style={{
                padding: '4px 10px', borderRadius: 5, fontSize: 11,
                background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)',
                color: '#22D3EE', cursor: 'pointer', fontFamily: 'Inter, sans-serif', fontWeight: 500,
              }}
            >
              ✎ Edit Spec
            </button>
          )}
          <button
            onClick={() => downloadOpenApi(services, diagramTitle)}
            style={{
              padding: '4px 10px', borderRadius: 5, fontSize: 11,
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#A78BFA', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            ↓ OpenAPI
          </button>
          <button
            onClick={() => downloadMarkdown(services, diagramTitle)}
            style={{
              padding: '4px 10px', borderRadius: 5, fontSize: 11,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#71717A', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            }}
          >
            ↓ Markdown
          </button>
        </div>

        {/* Stats */}
        <div style={{ padding: '8px 14px', fontSize: 11, color: '#52525B', fontFamily: 'Inter, sans-serif', borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.04))' }}>
          {allEndpoints.length} endpoints · {services.length} services
        </div>

        {/* Endpoint list by service */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {services.map(svc => (
            <div key={svc.id}>
              <button
                onClick={() => setSelectedService(svc)}
                style={{
                  width: '100%', padding: '8px 14px', textAlign: 'left',
                  background: selectedService?.id === svc.id ? 'rgba(99,102,241,0.08)' : 'none',
                  border: 'none', borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.04))',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 600, color: '#C4B5FD', fontFamily: 'Inter, sans-serif' }}>{svc.name}</div>
                <div style={{ fontSize: 10, color: '#52525B', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>{svc.endpoints.length} endpoints</div>
              </button>
              {svc.endpoints.slice(0, 4).map(ep => (
                <div key={ep.id} style={{ padding: '5px 14px 5px 20px', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    padding: '1px 5px', borderRadius: 3, fontSize: 8,
                    fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                    background: ep.method === 'GET' ? 'rgba(34,197,94,0.15)' : ep.method === 'POST' ? 'rgba(59,130,246,0.15)' : ep.method === 'DELETE' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
                    color: ep.method === 'GET' ? '#22C55E' : ep.method === 'POST' ? '#3B82F6' : ep.method === 'DELETE' ? '#EF4444' : '#EAB308',
                  }}>
                    {ep.method}
                  </span>
                  <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#71717A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ep.path}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Architecture view switcher */}
        {services.length > 0 && (
          <div style={{
            borderTop: '1px solid var(--color-border, rgba(255,255,255,0.06))',
            padding: '10px 12px 12px',
            flexShrink: 0,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600, color: '#52525B',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              marginBottom: 8, fontFamily: 'Inter, sans-serif',
            }}>
              Architecture
            </div>
            {(['c4_l1', 'c4_l2'] as const).map(view => {
              const active = currentView === view
              const isL1 = view === 'c4_l1'
              return (
                <button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    width: '100%', padding: '7px 10px', borderRadius: 7,
                    marginBottom: isL1 ? 6 : 0, cursor: 'pointer',
                    background: active
                      ? (isL1 ? 'rgba(167,139,250,0.14)' : 'rgba(139,92,246,0.14)')
                      : (isL1 ? 'rgba(167,139,250,0.08)' : 'rgba(139,92,246,0.08)'),
                    border: active
                      ? `1px solid ${isL1 ? 'rgba(167,139,250,0.4)' : 'rgba(139,92,246,0.4)'}`
                      : `1px solid ${isL1 ? 'rgba(167,139,250,0.2)' : 'rgba(139,92,246,0.2)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span style={{
                    width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                    background: isL1 ? '#A78BFA' : '#8B5CF6',
                  }} />
                  <span style={{
                    fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: active ? 600 : 500,
                    color: active ? '#C4B5FD' : '#9CA3AF', flex: 1, textAlign: 'left',
                  }}>
                    {isL1 ? 'C4 L1 — System Context' : 'C4 L2 — Containers'}
                  </span>
                  {active && <span style={{ fontSize: 9, color: '#6B7280' }}>●</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Center: canvas + breadcrumb ─────────────────────────────────────── */}
      <div style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Breadcrumb bar */}
        <div style={{
          padding: '7px 16px',
          borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.05))',
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--color-bg-secondary, rgba(9,9,11,0.6))',
          flexShrink: 0,
        }}>
          <button
            onClick={() => setCurrentView('c4_l1')}
            style={{
              background: 'none', border: 'none', padding: 0, cursor: currentView === 'c4_l2' ? 'pointer' : 'default',
              fontSize: 13, fontFamily: 'Inter, sans-serif',
              color: currentView === 'c4_l2' ? '#6366F1' : '#F1F5F9',
              fontWeight: currentView === 'c4_l1' ? 600 : 400,
            }}
          >
            System Context
          </button>
          {currentView === 'c4_l2' && (
            <>
              <span style={{ color: '#3F3F46', fontSize: 13 }}>/</span>
              <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: '#F1F5F9', fontWeight: 600 }}>
                Containers
              </span>
            </>
          )}
        </div>

        {/* React Flow canvas */}
        <div style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onNodesChange={onNodesChange}
            onNodeDragStop={handleNodeDragStop}
            nodesDraggable
            nodesConnectable={false}
            elementsSelectable
            panOnDrag
            zoomOnScroll
            fitView
            style={{ background: 'transparent' }}
          >
            <Background color="rgba(255,255,255,0.04)" gap={24} />
            <Controls />
          </ReactFlow>
        </div>
      </div>

      {/* ── Right: endpoint detail panel ────────────────────────────────────── */}
      {selectedService && (
        <EndpointPanel
          endpoints={selectedService.endpoints}
          serviceName={selectedService.name}
          onClose={() => setSelectedService(null)}
        />
      )}
    </div>
  )
}
