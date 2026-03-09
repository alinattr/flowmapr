import type { Node, Edge, MarkerType } from '@xyflow/react'

interface RawNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
  [key: string]: unknown
}

interface RawEdge {
  id: string
  source: string
  target: string
  type?: string
  label?: string
  sourceHandle?: string
  targetHandle?: string
  [key: string]: unknown
}

const CONTAINER_TYPES = new Set(['bpmnPool', 'bpmnLane'])

const UML_EDGE_TYPES = new Set([
  'uml_association',
  'uml_aggregation',
  'uml_composition',
  'uml_inheritance',
  'uml_implementation',
  'uml_dependency',
])

const UML_EDGE_STYLES: Record<string, {
  strokeDasharray?: string
  markerEnd?: { type: MarkerType; width: number; height: number; color: string }
  markerStart?: { type: MarkerType; width: number; height: number; color: string }
}> = {
  uml_association: {
    markerEnd: { type: 'arrowclosed' as MarkerType, width: 14, height: 14, color: '#6B7280' },
  },
  uml_aggregation: {
    markerEnd: { type: 'arrowclosed' as MarkerType, width: 14, height: 14, color: '#6B7280' },
  },
  uml_composition: {
    markerEnd: { type: 'arrowclosed' as MarkerType, width: 14, height: 14, color: '#6B7280' },
  },
  uml_inheritance: {
    markerEnd: { type: 'arrow' as MarkerType, width: 16, height: 16, color: '#6B7280' },
  },
  uml_implementation: {
    strokeDasharray: '6 3',
    markerEnd: { type: 'arrow' as MarkerType, width: 16, height: 16, color: '#6B7280' },
  },
  uml_dependency: {
    strokeDasharray: '6 3',
    markerEnd: { type: 'arrowclosed' as MarkerType, width: 14, height: 14, color: '#6B7280' },
  },
}

function isPlaceholderText(value: unknown): boolean {
  return typeof value === 'string' && /^\s*\[[^\]]+\]\s*$/.test(value)
}

function c4FallbackDescription(type: string, label: string, isExternal: boolean): string {
  const clean = label.trim() || 'System'
  if (type === 'c4Person') return `${clean} interacts with the system.`
  if (isExternal || type === 'c4SystemExt') return `${clean} is an external system integration.`
  return `${clean} handles core business capabilities for this system.`
}

export function parseFlowData(raw: {
  nodes?: RawNode[]
  edges?: RawEdge[]
}): { nodes: Node[]; edges: Edge[] } {
  const rawNodes = (raw.nodes ?? []).map((node) => {
    if (!node.type.startsWith('c4')) return node
    const data = { ...(node.data ?? {}) }
    const label = String(data.label ?? '').trim()
    const isExternal = data.isExternal === true || data.external === true || node.type === 'c4SystemExt'
    const description = typeof data.description === 'string' ? data.description.trim() : ''
    data.isExternal = isExternal
    data.description = !description || isPlaceholderText(description)
      ? c4FallbackDescription(node.type, label, isExternal)
      : description
    if (isPlaceholderText(data.technology)) data.technology = null
    return { ...node, data }
  })
  const nodeTypeById = new Map(rawNodes.map((n) => [n.id, n.type]))

  const contentNodes = rawNodes.filter((n) => !CONTAINER_TYPES.has(n.type))
  const maxX = contentNodes.length > 0
    ? Math.max(...contentNodes.map((n) => n.position.x))
    : 0
  const maxY = contentNodes.length > 0
    ? Math.max(...contentNodes.map((n) => n.position.y))
    : 0

  const poolNode = rawNodes.find((n) => n.type === 'bpmnPool')
  const declaredPoolW = poolNode ? ((poolNode.data.width as number) ?? 900) : 900
  const declaredPoolH = poolNode ? ((poolNode.data.height as number) ?? 500) : 500
  const poolW = Math.max(declaredPoolW, maxX + 220)
  const poolH = Math.max(declaredPoolH, maxY + 140)
  const poolX = poolNode?.position.x ?? 20

  const nodes: Node[] = rawNodes.map((node) => {
    if (node.type === 'bpmnPool') {
      return {
        ...node,
        style: { width: poolW, height: poolH },
        zIndex: -2,
        draggable: false,
        selectable: false,
      } as Node
    }
    if (node.type === 'bpmnLane') {
      const h = (node.data.height as number) ?? 180
      const laneW = poolW - (node.position.x - poolX)
      return {
        ...node,
        style: { width: laneW, height: h },
        zIndex: -1,
        draggable: false,
        selectable: false,
      } as Node
    }
    return {
      ...node,
      zIndex: 1,
    } as Node
  })

  const c4OutgoingCounter = new Map<string, number>()
  const edges: Edge[] = (raw.edges ?? []).map((edge) => {
    const isUml = UML_EDGE_TYPES.has(edge.type ?? '')
    const umlStyle = isUml ? UML_EDGE_STYLES[edge.type!] : null
    const sourceType = nodeTypeById.get(edge.source) ?? ''
    const targetType = nodeTypeById.get(edge.target) ?? ''
    const isBpmnEdge = sourceType.startsWith('bpmn') || targetType.startsWith('bpmn')
    const isC4Edge = sourceType.startsWith('c4') || targetType.startsWith('c4')
    const isGatewayOutgoing = sourceType === 'bpmnGateway'
    const isYesNoLabel = typeof edge.label === 'string' && /^(yes|no)$/i.test(edge.label.trim())
    let c4SourceHandle: string | undefined
    if (sourceType.startsWith('c4')) {
      const next = (c4OutgoingCounter.get(edge.source) ?? 0) + 1
      c4OutgoingCounter.set(edge.source, next)
      const slot = ((next - 1) % 5) + 1
      c4SourceHandle = `source-bottom-${slot}`
    }

    return {
      ...edge,
      type: 'smoothstep',
      animated: false,
      reconnectable: true,
      zIndex: 10,
      data: { umlType: edge.type },
      style: {
        stroke: isUml ? '#6B7280' : 'var(--color-diagram-edge)',
        strokeWidth: 1.5,
        ...(umlStyle?.strokeDasharray ? { strokeDasharray: umlStyle.strokeDasharray } : {}),
      },
      markerEnd: umlStyle?.markerEnd ?? {
        type: 'arrowclosed' as MarkerType,
        width: 16,
        height: 16,
        color: 'var(--color-diagram-edge)',
      },
      labelStyle: {
        fontSize: 11,
        fontFamily: 'Inter',
        fill: 'var(--color-text-secondary)',
        ...(isBpmnEdge ? { transform: `translateY(${isGatewayOutgoing ? 24 : 14}px)` } : {}),
        ...(isYesNoLabel ? { fontWeight: 600 } : {}),
      },
      labelBgStyle: isBpmnEdge
        ? { fill: 'transparent', fillOpacity: 0 }
        : { fill: '#FFFFFF', fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 2,
      ...(isC4Edge && c4SourceHandle
        ? { sourceHandle: c4SourceHandle, targetHandle: edge.targetHandle ?? 'target-top' }
        : {}),
    } as Edge
  })

  return { nodes, edges }
}
