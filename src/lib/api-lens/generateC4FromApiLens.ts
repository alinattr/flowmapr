import type { Node, Edge } from '@xyflow/react'

interface ApiService {
  id: string
  name: string
  kind?: string
  technology?: string | null
  endpoints: Array<{ method: string; path: string }>
  position: { x: number; y: number }
}

interface ApiConnection {
  id: string
  source: string
  target: string
  label: string
}

export interface C4DiagramData {
  nodes: Node[]
  edges: Edge[]
  title: string
}

// Build a C4 L1 System Context diagram from API Lens services
export function generateC4L1FromServices(
  services: ApiService[],
  connections: ApiConnection[],
  systemName: string
): C4DiagramData {
  const internal = services.filter(s => s.kind !== 'external')
  const external = services.filter(s => s.kind === 'external')

  const nodes: Node[] = []
  const edges: Edge[] = []

  // End User (person)
  nodes.push({
    id: 'c4l1-user',
    type: 'c4Person',
    position: { x: 300, y: 40 },
    data: { label: 'End User', description: 'Uses the application', external: false },
  })

  // Main system boundary (represents the whole backend)
  nodes.push({
    id: 'c4l1-system',
    type: 'c4Container',
    position: { x: 260, y: 220 },
    data: {
      label: systemName,
      color: '#6366F1',
      technology: internal.length > 0
        ? internal.map(s => s.technology).filter(Boolean).join(', ') || 'API'
        : 'REST API',
      description: `${services.reduce((n, s) => n + s.endpoints.length, 0)} endpoints across ${internal.length} services`,
    },
  })

  // Edge: User → System
  edges.push({
    id: 'c4l1-user-system',
    source: 'c4l1-user',
    target: 'c4l1-system',
    label: 'uses',
    type: 'smoothstep',
    style: { stroke: 'rgba(99,102,241,0.5)', strokeWidth: 1.5 },
    markerEnd: { type: 'arrowclosed', width: 14, height: 14, color: 'rgba(99,102,241,0.5)' },
  } as Edge)

  // External systems (from connections)
  external.forEach((svc, i) => {
    const nodeId = `c4l1-ext-${svc.id}`
    nodes.push({
      id: nodeId,
      type: 'c4SystemExt',
      position: { x: 620, y: 180 + i * 180 },
      data: {
        label: svc.name,
        description: `External: ${svc.endpoints.length} endpoints`,
      },
    })
    edges.push({
      id: `c4l1-system-${svc.id}`,
      source: 'c4l1-system',
      target: nodeId,
      label: 'calls',
      type: 'smoothstep',
      style: { stroke: 'rgba(100,116,139,0.5)', strokeWidth: 1.5, strokeDasharray: '4 3' },
      markerEnd: { type: 'arrowclosed', width: 14, height: 14, color: 'rgba(100,116,139,0.5)' },
    } as Edge)
  })

  // If there are connections between internal services in the spec, show a DB node
  const hasDb = services.some(s => s.kind === 'database')
  if (hasDb) {
    const dbSvcs = services.filter(s => s.kind === 'database')
    dbSvcs.forEach((db, i) => {
      const nodeId = `c4l1-db-${db.id}`
      nodes.push({
        id: nodeId,
        type: 'c4Container',
        position: { x: 260, y: 440 + i * 160 },
        data: {
          label: db.name,
          color: '#3B82F6',
          technology: db.technology ?? 'Database',
          description: 'Data storage',
        },
      })
      edges.push({
        id: `c4l1-system-db-${db.id}`,
        source: 'c4l1-system',
        target: nodeId,
        label: 'reads/writes',
        type: 'smoothstep',
        style: { stroke: 'rgba(59,130,246,0.5)', strokeWidth: 1.5 },
        markerEnd: { type: 'arrowclosed', width: 14, height: 14, color: 'rgba(59,130,246,0.5)' },
      } as Edge)
    })
  }

  return { nodes, edges, title: `${systemName} — C4 L1` }
}

// Build a C4 L2 Container diagram from API Lens services
export function generateC4L2FromServices(
  services: ApiService[],
  connections: ApiConnection[],
  systemName: string
): C4DiagramData {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Service → node mapping (positioned in a grid)
  const idMap: Record<string, string> = {}

  services.forEach((svc, i) => {
    const col = i % 3
    const row = Math.floor(i / 3)
    const nodeId = `c4l2-${svc.id}`
    idMap[svc.id] = nodeId

    const isExternal = svc.kind === 'external'
    const isDb = svc.kind === 'database' || svc.kind === 'cache'
    const color = isExternal ? '#94A3B8' : isDb ? '#3B82F6' : '#6366F1'
    const endpointSummary = svc.endpoints.slice(0, 2)
      .map(e => `${e.method} ${e.path}`)
      .join(', ') || svc.name

    nodes.push({
      id: nodeId,
      type: isExternal ? 'c4SystemExt' : 'c4Container',
      position: { x: 80 + col * 300, y: 80 + row * 220 },
      data: {
        label: svc.name,
        color,
        technology: svc.technology ?? (isDb ? 'Database' : 'Service'),
        description: `${svc.endpoints.length} endpoints — ${endpointSummary}`,
        external: isExternal,
      },
    })
  })

  // Map API Lens connections to C4 edges
  connections.forEach(conn => {
    const srcNode = idMap[conn.source]
    const tgtNode = idMap[conn.target]
    if (!srcNode || !tgtNode) return
    const srcSvc = services.find(s => s.id === conn.source)
    const isExternal = srcSvc?.kind === 'external'

    edges.push({
      id: `c4l2-${conn.id}`,
      source: srcNode,
      target: tgtNode,
      label: conn.label,
      type: 'smoothstep',
      style: {
        stroke: isExternal ? 'rgba(100,116,139,0.5)' : 'rgba(99,102,241,0.5)',
        strokeWidth: 1.5,
        strokeDasharray: isExternal ? '4 3' : undefined,
      },
      markerEnd: {
        type: 'arrowclosed',
        width: 14,
        height: 14,
        color: isExternal ? 'rgba(100,116,139,0.5)' : 'rgba(99,102,241,0.5)',
      },
    } as Edge)
  })

  return { nodes, edges, title: `${systemName} — C4 L2` }
}
