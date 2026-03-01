import type { Node, Edge } from '@xyflow/react'

const BPMN_TYPE_MAP: Record<string, string> = {
  startEvent: 'bpmnStartEvent',
  endEvent: 'bpmnEndEvent',
  task: 'bpmnTask',
  userTask: 'bpmnTask',
  serviceTask: 'bpmnTask',
  scriptTask: 'bpmnTask',
  manualTask: 'bpmnTask',
  sendTask: 'bpmnTask',
  receiveTask: 'bpmnTask',
  exclusiveGateway: 'bpmnGateway',
  inclusiveGateway: 'bpmnGateway',
  parallelGateway: 'bpmnGateway',
  complexGateway: 'bpmnGateway',
  participant: 'bpmnPool',
  lane: 'bpmnLane',
}

function attr(el: Element, name: string): string {
  return el.getAttribute(name) ?? ''
}

export function parseBpmnXml(xmlStr: string): { nodes: Node[]; edges: Edge[] } {
  const parser = new DOMParser()
  const doc = parser.parseFromString(xmlStr, 'application/xml')

  const nodes: Node[] = []
  const edges: Edge[] = []

  // Collect shapes from BPMNPlane for position/size info
  const shapes = new Map<string, { x: number; y: number; w: number; h: number }>()
  doc.querySelectorAll('BPMNShape').forEach(shape => {
    const id = attr(shape, 'bpmnElement')
    const bounds = shape.querySelector('Bounds')
    if (bounds) {
      shapes.set(id, {
        x: Number(attr(bounds, 'x')),
        y: Number(attr(bounds, 'y')),
        w: Number(attr(bounds, 'width')),
        h: Number(attr(bounds, 'height')),
      })
    }
  })

  // Process elements
  const allElements = doc.querySelectorAll('[id]')
  allElements.forEach(el => {
    const localName = el.localName.replace(/^bpmn2?:/, '')
    const nodeType = BPMN_TYPE_MAP[localName]
    if (!nodeType) return

    const id = attr(el, 'id')
    if (!id) return
    const label = attr(el, 'name') || localName

    const pos = shapes.get(id) ?? { x: 100, y: 100, w: 140, h: 60 }
    const data: Record<string, unknown> = { label }

    if (localName === 'parallelGateway') data.gatewayType = 'parallel'
    else if (localName.includes('Gateway')) data.gatewayType = 'xor'
    if (localName === 'participant') { data.width = pos.w; data.height = pos.h }
    if (localName === 'lane') { data.width = pos.w; data.height = pos.h }

    nodes.push({
      id,
      type: nodeType,
      position: { x: pos.x, y: pos.y },
      data,
    } as Node)
  })

  // Sequence flows → edges
  doc.querySelectorAll('sequenceFlow').forEach(sf => {
    edges.push({
      id: attr(sf, 'id') || `edge-${Math.random()}`,
      source: attr(sf, 'sourceRef'),
      target: attr(sf, 'targetRef'),
      label: attr(sf, 'name') || undefined,
    } as Edge)
  })

  return { nodes, edges }
}
