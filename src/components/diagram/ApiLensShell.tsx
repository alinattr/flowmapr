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

export interface ApiLensService {
  id: string
  name: string
  kind?: string
  technology?: string | null
  endpoints: ApiEndpoint[]
  position: { x: number; y: number }
}

export type ApiLensConnection = { id: string; source: string; target: string; label: string }

type ApiLensView = 'c4_l1' | 'c4_l2'

interface ApiLensShellProps {
  services: ApiLensService[]
  connections: ApiLensConnection[]
  diagramTitle?: string
  linkedC4?: { l1Id: string | null; l2Id: string | null }
  onEditSpec?: () => void
  /** Supabase diagram ID — enables drag-position persistence */
  diagramId?: string
  /** Public share / embed: no edit, no exports, no dragging */
  readOnly?: boolean
  /** Restored L1 node positions from `flow_data.c4l1_positions` */
  c4l1Positions?: Record<string, { x: number; y: number }> | null
  /** Restored L2 node positions from `flow_data.c4l2_positions` */
  c4l2Positions?: Record<string, { x: number; y: number }> | null
}

function cleanText(value: string | undefined | null): string {
  return String(value ?? '').trim()
}

function isPlaceholder(value: string | undefined | null): boolean {
  return /^\s*\[[^\]]+\]\s*$/.test(String(value ?? ''))
}

function withFallbackDescription(
  label: string,
  variant: 'person' | 'internal' | 'external',
  description?: string | null,
): string {
  const clean = cleanText(description)
  if (clean && !isPlaceholder(clean)) return clean
  if (variant === 'person') return `${label} interacts with the platform.`
  if (variant === 'external') return `${label} is an external system integration.`
  return `${label} provides core platform capabilities.`
}

function summarizeEndpoints(endpoints: ApiEndpoint[], limit = 2): string {
  return endpoints
    .slice(0, limit)
    .map((e) => `${e.method} ${e.path}`)
    .join(', ')
}

function primaryEndpointLabel(endpoints: ApiEndpoint[]): string {
  const first = endpoints[0]
  if (!first) return 'Uses API'
  return `${first.method} ${first.path}`
}

function shortL1ActionLabel(service: ApiLensService): string {
  const name = cleanText(service.name).toLowerCase()
  const has = (re: RegExp) =>
    re.test(name) || service.endpoints.some((e) => re.test(e.path.toLowerCase()))

  if (has(/auth|login|token|otp|register/)) return 'Authenticates via'
  if (has(/wallet|balance|topup|payment/)) return 'Manages wallet via'
  if (has(/transaction|transfer|statement|history/)) return 'Queries transactions via'
  return 'Uses'
}

// ─── C4 L1 node builder (system context view) ─────────────────────────────────

function applySavedPositions(
  nodes: Node[],
  positions?: Record<string, { x: number; y: number }> | null,
): Node[] {
  if (!positions || typeof positions !== 'object') return nodes
  return nodes.map((n) => {
    const p = positions[n.id]
    if (p && Number.isFinite(p.x) && Number.isFinite(p.y)) {
      return { ...n, position: { x: p.x, y: p.y } }
    }
    return n
  })
}

function buildC4L1(
  services: ApiLensService[],
  _connections: ApiLensConnection[],
): { nodes: Node[]; edges: Edge[] } {
  const clientId = '__client'
  const visibleServices = services.filter((s) => cleanText(s.name).length > 0)
  const systemNodeIds: string[] = []
  const builtNodes: Node[] = []
  const builtEdges: Edge[] = []

  const count = Math.max(visibleServices.length, 1)
  const spacingX = 250
  const totalWidth = (count - 1) * spacingX
  const centerX = 520
  const startX = centerX - totalWidth / 2
  const systemsY = 260

  builtNodes.push({
    id: clientId,
    type: 'apiLensC4',
    position: { x: centerX, y: 50 },
    data: {
      variant: 'person',
      label: 'Client',
      stereotype: 'Person',
      description: 'End user interacting with the platform.',
    },
  })

  visibleServices.forEach((svc, i) => {
    const label = cleanText(svc.name)
    if (!label) return
    const isExternal = svc.kind === 'external'
    const stereotype = isExternal
      ? (svc.technology ? `Software System: ${svc.technology}` : 'Software System')
      : 'Software System'
    const desc = withFallbackDescription(
      label,
      isExternal ? 'external' : 'internal',
      summarizeEndpoints(svc.endpoints) || `${svc.endpoints.length} endpoint${svc.endpoints.length !== 1 ? 's' : ''}`,
    )
    builtNodes.push({
      id: svc.id,
      type: 'apiLensC4',
      position: { x: startX + i * spacingX, y: systemsY },
      data: {
        variant: isExternal ? 'external' : 'internal',
        label,
        stereotype,
        description: desc,
      },
    })
    systemNodeIds.push(svc.id)
  })

  // Canonical L1: Client -> each system (no service-to-service edges on L1)
  systemNodeIds.forEach((targetId, idx) => {
    const svc = visibleServices.find((s) => s.id === targetId)
    builtEdges.push({
      id: `l1-client-${targetId}`,
      source: clientId,
      target: targetId,
      sourceHandle: `source-bottom-${(idx % 5) + 1}`,
      targetHandle: 'target-top',
      label: svc ? shortL1ActionLabel(svc) : 'Uses',
      type: 'smoothstep',
      style: { stroke: 'rgba(17,104,189,0.45)', strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: '#64748B', fontFamily: 'Inter' },
      markerEnd: { type: 'arrowclosed', width: 12, height: 12, color: 'rgba(17,104,189,0.5)' },
    } as Edge)
  })

  return { nodes: builtNodes, edges: builtEdges }
}

// ─── C4 L2 node builder (container detail view) ───────────────────────────────

function buildC4L2(
  services: ApiLensService[],
  connections: ApiLensConnection[],
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  const idMap: Record<string, string> = {}
  const clientId = '__client-l2'

  const containerServices = services.filter((svc) => cleanText(svc.name).length > 0)
  const count = Math.max(containerServices.length, 1)
  const spacingX = 280
  const totalWidth = (count - 1) * spacingX
  const centerX = 500
  const startX = centerX - totalWidth / 2

  nodes.push({
    id: clientId,
    type: 'apiLensC4',
    position: { x: centerX, y: 40 },
    data: {
      variant: 'person',
      label: 'Client',
      stereotype: 'Person',
      description: 'Consumes API endpoints.',
    },
  })

  containerServices.forEach((svc, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const nodeId = `c4l2-${svc.id}`
    idMap[svc.id] = nodeId

    const isExternal = svc.kind === 'external'
    const isDb = svc.kind === 'database' || svc.kind === 'cache'

    nodes.push({
      id: nodeId,
      type: 'apiLensC4',
      position: { x: startX + col * 280, y: 220 + row * 200 },
      data: {
        variant: isExternal ? 'external' : 'internal',
        label: cleanText(svc.name),
        stereotype: svc.technology
          ? (isDb ? `Database: ${svc.technology}` : `Container: ${svc.technology}`)
          : isDb ? 'Database' : isExternal ? 'External System' : 'Container',
        description: withFallbackDescription(
          cleanText(svc.name),
          isExternal ? 'external' : 'internal',
          `${svc.endpoints.length} endpoint${svc.endpoints.length !== 1 ? 's' : ''}`,
        ),
      },
    })
  })

  // Infer Client -> Container edges from endpoint exposure
  containerServices.forEach((svc, idx) => {
    const target = idMap[svc.id]
    if (!target) return
    const endpointSummary = primaryEndpointLabel(svc.endpoints)
    const hasAuthLikeEndpoints = svc.endpoints.some((e) => /\/auth|\/login|\/token|\/otp|\/register/i.test(e.path))
      || /auth/i.test(svc.name)
    const label = hasAuthLikeEndpoints
      ? (endpointSummary === 'Uses API' ? 'Authenticates via' : endpointSummary)
      : endpointSummary
    edges.push({
      id: `l2-client-${svc.id}`,
      source: clientId,
      target,
      sourceHandle: `source-bottom-${(idx % 5) + 1}`,
      targetHandle: 'target-top',
      label,
      type: 'smoothstep',
      style: { stroke: 'rgba(17,104,189,0.45)', strokeWidth: 1.5 },
      labelStyle: { fontSize: 10, fill: '#64748B', fontFamily: 'Inter' },
      markerEnd: { type: 'arrowclosed', width: 12, height: 12, color: 'rgba(17,104,189,0.5)' },
    } as Edge)
  })

  // Preserve inferred inter-container relationships from analysis output
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

  const seen = new Set<string>()
  const dedupedEdges = edges.filter((e) => {
    const key = `${e.source}-${e.target}-${e.label ?? ''}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return { nodes, edges: dedupedEdges }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ApiLensShell({
  services,
  connections,
  diagramTitle = 'API Documentation',
  onEditSpec,
  diagramId,
  readOnly = false,
  c4l1Positions = null,
  c4l2Positions = null,
}: ApiLensShellProps) {
  const [selectedService, setSelectedService] = useState<ApiLensService | null>(null)
  const [currentView, setCurrentView] = useState<ApiLensView>('c4_l1')

  // Compute initial node/edge sets once at mount
  const initRef = useRef<{
    l1: { nodes: Node[]; edges: Edge[] }
    l2: { nodes: Node[]; edges: Edge[] }
  } | null>(null)
  if (!initRef.current) {
    const l1built = buildC4L1(services, connections)
    const l2built = buildC4L2(services, connections)
    initRef.current = {
      l1: {
        nodes: applySavedPositions(l1built.nodes, c4l1Positions),
        edges: l1built.edges,
      },
      l2: {
        nodes: applySavedPositions(l2built.nodes, c4l2Positions),
        edges: l2built.edges,
      },
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
    if (readOnly || !diagramId) return
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
  }, [readOnly, diagramId, currentView, c4l1Nodes, c4l2Nodes, services, connections])

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
          {!readOnly && onEditSpec && (
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
          {!readOnly && (
            <>
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
            </>
          )}
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
        <div className="api-lens-c4-canvas" style={{ flex: 1 }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onNodesChange={onNodesChange}
            onNodeDragStop={readOnly ? undefined : handleNodeDragStop}
            nodesDraggable={!readOnly}
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
