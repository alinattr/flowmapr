import type { Node, Edge } from '@xyflow/react'

const NS = {
  bpmn: 'http://www.omg.org/spec/BPMN/20100524/MODEL',
  bpmndi: 'http://www.omg.org/spec/BPMN/20100524/DI',
  dc: 'http://www.omg.org/spec/DD/20100524/DC',
  di: 'http://www.omg.org/spec/DD/20100524/DI',
}

const TYPE_MAP: Record<string, string> = {
  bpmnTask: 'task',
  bpmnGateway: 'gateway',
  bpmnStartEvent: 'startEvent',
  bpmnEndEvent: 'endEvent',
  bpmnPool: 'pool',
  bpmnLane: 'lane',
}

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function getNodeSize(type: string) {
  switch (type) {
    case 'bpmnStartEvent':
    case 'bpmnEndEvent': return { w: 36, h: 36 }
    case 'bpmnGateway':  return { w: 50, h: 50 }
    case 'bpmnPool':     return { w: 900, h: 500 }
    case 'bpmnLane':     return { w: 864, h: 180 }
    default:             return { w: 140, h: 60 }
  }
}

export function generateBpmnXml(nodes: Node[], edges: Edge[], title = 'Process'): string {
  const processId = 'Process_1'
  const diagramId = 'BPMNDiagram_1'
  const planeId   = 'BPMNPlane_1'

  const elements: string[] = []
  const shapes: string[] = []
  const edgeEls: string[] = []

  for (const node of nodes) {
    const data = node.data as Record<string, unknown>
    const label = escapeXml(String(data.label ?? ''))
    const bpmnType = TYPE_MAP[node.type ?? ''] ?? 'task'
    const { w, h } = getNodeSize(node.type ?? '')
    const nodeW = typeof data.width === 'number' ? data.width : w
    const nodeH = typeof data.height === 'number' ? data.height : h
    const x = node.position.x
    const y = node.position.y

    if (bpmnType === 'pool') {
      elements.push(`  <bpmn:collaboration id="Collab_1"><bpmn:participant id="${node.id}" name="${label}" processRef="${processId}"/></bpmn:collaboration>`)
      shapes.push(`
    <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isHorizontal="true">
      <dc:Bounds x="${x}" y="${y}" width="${nodeW}" height="${nodeH}"/>
    </bpmndi:BPMNShape>`)
      continue
    }

    if (bpmnType === 'lane') {
      elements.push(`  <bpmn:laneSet id="LaneSet_${node.id}"><bpmn:lane id="${node.id}" name="${label}"/></bpmn:laneSet>`)
      shapes.push(`
    <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}" isHorizontal="true">
      <dc:Bounds x="${x}" y="${y}" width="${nodeW}" height="${nodeH}"/>
    </bpmndi:BPMNShape>`)
      continue
    }

    if (bpmnType === 'gateway') {
      const gType = data.gatewayType === 'parallel' ? 'parallelGateway' : 'exclusiveGateway'
      elements.push(`  <bpmn:${gType} id="${node.id}" name="${label}"/>`)
    } else if (bpmnType === 'startEvent') {
      elements.push(`  <bpmn:startEvent id="${node.id}" name="${label}"/>`)
    } else if (bpmnType === 'endEvent') {
      elements.push(`  <bpmn:endEvent id="${node.id}" name="${label}"/>`)
    } else {
      elements.push(`  <bpmn:task id="${node.id}" name="${label}"/>`)
    }

    shapes.push(`
    <bpmndi:BPMNShape id="${node.id}_di" bpmnElement="${node.id}">
      <dc:Bounds x="${x}" y="${y}" width="${nodeW}" height="${nodeH}"/>
      <bpmndi:BPMNLabel/>
    </bpmndi:BPMNShape>`)
  }

  for (const edge of edges) {
    const label = escapeXml(String(edge.label ?? ''))
    elements.push(`  <bpmn:sequenceFlow id="${edge.id}" sourceRef="${edge.source}" targetRef="${edge.target}"${label ? ` name="${label}"` : ''}/>`)

    const src = nodes.find(n => n.id === edge.source)
    const tgt = nodes.find(n => n.id === edge.target)
    if (src && tgt) {
      const { w: sw, h: sh } = getNodeSize(src.type ?? '')
      const { w: tw, h: th } = getNodeSize(tgt.type ?? '')
      const x1 = src.position.x + sw / 2
      const y1 = src.position.y + sh / 2
      const x2 = tgt.position.x + tw / 2
      const y2 = tgt.position.y + th / 2
      edgeEls.push(`
    <bpmndi:BPMNEdge id="${edge.id}_di" bpmnElement="${edge.id}">
      <di:waypoint x="${x1}" y="${y1}"/>
      <di:waypoint x="${x2}" y="${y2}"/>
      ${label ? `<bpmndi:BPMNLabel><dc:Bounds x="${(x1+x2)/2-20}" y="${(y1+y2)/2-10}" width="40" height="20"/></bpmndi:BPMNLabel>` : ''}
    </bpmndi:BPMNEdge>`)
    }
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<bpmn:definitions xmlns:bpmn="${NS.bpmn}" xmlns:bpmndi="${NS.bpmndi}" xmlns:dc="${NS.dc}" xmlns:di="${NS.di}" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">`,
    ...elements,
    `  <bpmn:process id="${processId}" name="${escapeXml(title)}" isExecutable="false"/>`,
    `  <bpmndi:BPMNDiagram id="${diagramId}">`,
    `    <bpmndi:BPMNPlane id="${planeId}" bpmnElement="${processId}">`,
    ...shapes,
    ...edgeEls,
    `    </bpmndi:BPMNPlane>`,
    `  </bpmndi:BPMNDiagram>`,
    `</bpmn:definitions>`,
  ].join('\n')
}
