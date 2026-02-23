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

export function parseFlowData(raw: {
  nodes?: RawNode[]
  edges?: RawEdge[]
}): { nodes: Node[]; edges: Edge[] } {
  const rawNodes = raw.nodes ?? []

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

  const edges: Edge[] = (raw.edges ?? []).map((edge) => {
    const isUml = UML_EDGE_TYPES.has(edge.type ?? '')
    const umlStyle = isUml ? UML_EDGE_STYLES[edge.type!] : null

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
      },
      labelBgStyle: { fill: '#FFFFFF', fillOpacity: 0.9 },
      labelBgPadding: [4, 2] as [number, number],
      labelBgBorderRadius: 2,
    } as Edge
  })

  return { nodes, edges }
}
