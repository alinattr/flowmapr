'use client'

import { useState, useCallback, useMemo } from 'react'
import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { ApiLensC4Node } from './nodes/api-lens/ApiLensC4Node'
import { EndpointPanel } from './EndpointPanel'
import { downloadOpenApi } from '@/lib/diagram/exportOpenApi'
import { downloadMarkdown } from '@/lib/diagram/exportMarkdown'

const nodeTypes = { apiLensC4: ApiLensC4Node }

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

interface ApiLensShellProps {
  services: ApiService[]
  connections: Array<{ id: string; source: string; target: string; label: string }>
  diagramTitle?: string
  linkedC4?: { l1Id: string | null; l2Id: string | null }
  onEditSpec?: () => void
}

export function ApiLensShell({ services, connections, diagramTitle = 'API Documentation', linkedC4, onEditSpec }: ApiLensShellProps) {
  const [selectedService, setSelectedService] = useState<ApiService | null>(null)

  // Build proper C4-style nodes from API Lens services
  const { nodes, edges } = useMemo(() => {
    const builtNodes: Node[] = []
    const builtEdges: Edge[] = []

    const internalSvcs = services.filter(s => s.kind !== 'external')
    const externalSvcs = services.filter(s => s.kind === 'external')
    const dbSvcs = services.filter(s => s.kind === 'database' || s.kind === 'cache')
    const appSvcs = services.filter(s => s.kind !== 'external' && s.kind !== 'database' && s.kind !== 'cache')

    // 1. Person node — always present
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

    // 2. Gateway / first app service as "Mobile App" or use first service
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

    // 3. Remaining app services in a grid (excluding the gateway/first)
    const remainingApp = appSvcs.filter(s => s.id !== gatewayOrFirst?.id)
    remainingApp.forEach((svc, i) => {
      const col = i % 3
      const row = Math.floor(i / 3)
      const x = 340 + col * 220
      const y = 120 + row * 180
      builtNodes.push({
        id: svc.id,
        type: 'apiLensC4',
        position: { x, y },
        data: {
          variant: 'internal',
          label: svc.name,
          stereotype: svc.technology ? `Container: ${svc.technology}` : 'Software System',
          description: svc.endpoints.slice(0, 2).map(e => `${e.method} ${e.path}`).join('\n') || '',
        },
      })
      // Connect from entry point
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

    // 4. Database / cache nodes
    const dbStartX = remainingApp.length > 0 ? 340 : 340
    dbSvcs.forEach((svc, i) => {
      const x = dbStartX + i * 220
      const rows = Math.ceil(remainingApp.length / 3)
      const y = 120 + rows * 180 + 60
      builtNodes.push({
        id: svc.id,
        type: 'apiLensC4',
        position: { x, y },
        data: {
          variant: 'internal',
          label: svc.name,
          stereotype: svc.kind === 'cache' ? 'Container: Cache' : 'Container: Database',
          description: `${svc.endpoints.length} operation${svc.endpoints.length !== 1 ? 's' : ''}`,
        },
      })
      // Connect from a relevant app service or entry
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

    // 5. External systems — positioned to the right
    externalSvcs.forEach((svc, i) => {
      const y = 180 + i * 200
      builtNodes.push({
        id: svc.id,
        type: 'apiLensC4',
        position: { x: 820, y },
        data: {
          variant: 'external',
          label: svc.name,
          stereotype: svc.technology ? `External: ${svc.technology}` : 'External System',
          description: `${svc.endpoints.length} endpoint${svc.endpoints.length !== 1 ? 's' : ''}`,
        },
      })
    })

    // 6. Map original API Lens connections between services (override with cleaner style)
    const existingNodeIds = new Set(builtNodes.map(n => n.id))
    connections.forEach(c => {
      if (!existingNodeIds.has(c.source) || !existingNodeIds.has(c.target)) return
      const srcSvc = services.find(s => s.id === c.source)
      const isExternal = srcSvc?.kind === 'external'
      builtEdges.push({
        id: `conn-${c.id}`,
        source: c.source,
        target: c.target,
        label: c.label,
        type: 'smoothstep',
        style: {
          stroke: isExternal ? 'rgba(100,116,139,0.45)' : 'rgba(99,102,241,0.35)',
          strokeWidth: 1.5,
        },
        labelStyle: { fontSize: 10, fill: '#64748B', fontFamily: 'Inter' },
        markerEnd: {
          type: 'arrowclosed', width: 12, height: 12,
          color: isExternal ? 'rgba(100,116,139,0.5)' : 'rgba(99,102,241,0.45)',
        },
      } as Edge)
    })

    // Deduplicate edges (prefer explicit connections over auto-generated)
    const seen = new Set<string>()
    const dedupedEdges = builtEdges.filter(e => {
      const key = `${e.source}-${e.target}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    return { nodes: builtNodes, edges: dedupedEdges }
  }, [services, connections])

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    const svc = services.find(s => s.id === node.id)
    setSelectedService(svc ?? null)
  }, [services])

  const allEndpoints = services.flatMap(s => s.endpoints)

  return (
    <div style={{ display: 'flex', height: '100%', position: 'relative' }}>
      {/* Left: endpoint list */}
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
                color: '#22D3EE', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
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

        {/* C4 Architecture Links */}
        {(linkedC4?.l1Id || linkedC4?.l2Id) && (
          <div style={{
            borderTop: '1px solid var(--color-border, rgba(255,255,255,0.06))',
            padding: '10px 12px 12px',
            flexShrink: 0,
          }}>
            <div style={{
              fontSize: 10, fontWeight: 600,
              color: 'var(--color-text-disabled, #52525B)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
              marginBottom: 8, fontFamily: 'Inter, sans-serif',
            }}>
              Architecture
            </div>

            {linkedC4.l1Id && (
              <a
                href={`/diagram/${linkedC4.l1Id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 7, textDecoration: 'none',
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.2)',
                  marginBottom: 6, transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(167,139,250,0.14)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(167,139,250,0.08)' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#A78BFA', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#C4B5FD', fontFamily: 'Inter', fontWeight: 500, flex: 1 }}>
                  C4 L1 — System Context
                </span>
                <span style={{ fontSize: 10, color: '#6B7280' }}>↗</span>
              </a>
            )}

            {linkedC4.l2Id && (
              <a
                href={`/diagram/${linkedC4.l2Id}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '7px 10px', borderRadius: 7, textDecoration: 'none',
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.14)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,92,246,0.08)' }}
              >
                <span style={{ width: 8, height: 8, borderRadius: 2, background: '#8B5CF6', flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#C4B5FD', fontFamily: 'Inter', fontWeight: 500, flex: 1 }}>
                  C4 L2 — Containers
                </span>
                <span style={{ fontSize: 10, color: '#6B7280' }}>↗</span>
              </a>
            )}
          </div>
        )}
      </div>

      {/* Center: architecture canvas */}
      <div style={{ flex: 1, height: '100%' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          style={{ background: 'transparent' }}
        >
          <Background color="rgba(255,255,255,0.04)" gap={24} />
          <Controls />
        </ReactFlow>
      </div>

      {/* Right: endpoint detail panel */}
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
