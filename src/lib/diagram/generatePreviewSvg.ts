import type { Node, Edge } from '@xyflow/react'

const W = 320
const H = 200

function nodeColor(type: string): string {
  const map: Record<string, string> = {
    bpmnTask: '#6366F1',
    bpmnGateway: '#EAB308',
    bpmnStartEvent: '#22C55E',
    bpmnEndEvent: '#EF4444',
    bpmnPool: '#6366F1',
    bpmnLane: '#6366F1',
    umlClass: '#A78BFA',
    erdEntity: '#3B82F6',
    seqParticipant: '#6366F1',
    seqMessage: '#818CF8',
    fcProcess: '#6366F1',
    fcDecision: '#3B82F6',
    fcStart: '#22C55E',
    fcEnd: '#EF4444',
    c4Person: '#6366F1',
    c4Container: '#6366F1',
    apiLensService: '#A78BFA',
  }
  return map[type] ?? '#6366F1'
}

export function generatePreviewSvg(nodes: Node[], edges: Edge[]): string {
  const contentNodes = nodes.filter(n => !['bpmnPool', 'bpmnLane', 'c4Boundary'].includes(n.type ?? ''))
  if (contentNodes.length === 0) return ''

  const xs = contentNodes.map(n => n.position.x)
  const ys = contentNodes.map(n => n.position.y)
  const minX = Math.min(...xs)
  const minY = Math.min(...ys)
  const maxX = Math.max(...xs) + 140
  const maxY = Math.max(...ys) + 60
  const srcW = Math.max(maxX - minX, 1)
  const srcH = Math.max(maxY - minY, 1)

  const padding = 16
  const scale = Math.min((W - padding * 2) / srcW, (H - padding * 2) / srcH, 1)
  const offsetX = padding + (W - padding * 2 - srcW * scale) / 2
  const offsetY = padding + (H - padding * 2 - srcH * scale) / 2

  const tx = (x: number) => ((x - minX) * scale + offsetX).toFixed(1)
  const ty = (y: number) => ((y - minY) * scale + offsetY).toFixed(1)

  const edgePaths = edges.map(e => {
    const src = contentNodes.find(n => n.id === e.source)
    const tgt = contentNodes.find(n => n.id === e.target)
    if (!src || !tgt) return ''
    const x1 = Number(tx(src.position.x + 60))
    const y1 = Number(ty(src.position.y + 20))
    const x2 = Number(tx(tgt.position.x + 60))
    const y2 = Number(ty(tgt.position.y + 20))
    const mx = (x1 + x2) / 2
    return `<path d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}" stroke="rgba(99,102,241,0.4)" stroke-width="1" fill="none" marker-end="url(#prev-arr)"/>`
  }).filter(Boolean)

  const nodeEls = contentNodes.map(n => {
    const color = nodeColor(n.type ?? '')
    const x = Number(tx(n.position.x))
    const y = Number(ty(n.position.y))
    const nw = Math.max(60, 100 * scale)
    const nh = 28 * scale

    if (n.type === 'bpmnGateway' || n.type === 'fcDecision') {
      const cx = x + nw / 2
      return `<polygon points="${cx},${y} ${x+nw},${y + nh / 2} ${cx},${y+nh} ${x},${y + nh / 2}" fill="${color}18" stroke="${color}60" stroke-width="1"/>`
    }
    if (n.type === 'bpmnStartEvent' || n.type === 'bpmnEndEvent' || n.type === 'fcStart' || n.type === 'fcEnd') {
      const r = nh / 2
      return `<circle cx="${x + nw/2}" cy="${y + r}" r="${r}" fill="${color}18" stroke="${color}60" stroke-width="1"/>`
    }
    const rx = n.type === 'c4Person' ? nh / 2 : 4
    return `<rect x="${x}" y="${y}" width="${nw}" height="${nh}" rx="${rx}" fill="${color}15" stroke="${color}50" stroke-width="1"/>`
  })

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    '<defs>',
    '<marker id="prev-arr" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">',
    '<path d="M0,0 L0,5 L5,2.5 z" fill="rgba(99,102,241,0.5)"/>',
    '</marker>',
    '</defs>',
    ...edgePaths,
    ...nodeEls,
    '</svg>',
  ].join('\n')
}

/* ── Sequence diagram preview ──────────────────────────────────── */

interface SeqPrev {
  participants: Array<{ id: string; label: string; x: number }>
  messages: Array<{ id: string; from: string; to: string; label: string; type: string; y: number }>
}

export function generateSequencePreview(data: SeqPrev): string {
  const { participants, messages } = data
  if (participants.length === 0) return ''

  const PW_SRC = 120
  const srcMinX = Math.min(...participants.map(p => p.x))
  const srcMaxX = Math.max(...participants.map(p => p.x)) + PW_SRC
  const srcMinY = 60
  const srcMaxY = messages.length > 0 ? Math.max(...messages.map(m => m.y)) + 40 : 300
  const srcW = Math.max(srcMaxX - srcMinX, 1)
  const srcH = Math.max(srcMaxY - srcMinY, 1)

  const pad = 14
  const scale = Math.min((W - pad * 2) / srcW, (H - pad * 2) / srcH)
  const oX = pad + (W - pad * 2 - srcW * scale) / 2
  const oY = pad + (H - pad * 2 - srcH * scale) / 2

  const sx = (x: number) => ((x - srcMinX) * scale + oX).toFixed(1)
  const sy = (y: number) => ((y - srcMinY) * scale + oY).toFixed(1)

  const els: string[] = []

  // Lifelines
  const lifeEndY = Number(sy(srcMaxY))
  for (const p of participants) {
    const cx = Number(sx(p.x + PW_SRC / 2))
    const topY = Number(sy(80))
    els.push(`<line x1="${cx}" y1="${topY}" x2="${cx}" y2="${lifeEndY}" stroke="rgba(99,102,241,0.15)" stroke-width="0.7" stroke-dasharray="3 2"/>`)
  }

  // Participant boxes
  const bw = Math.max(PW_SRC * scale, 24)
  const bh = Math.max(16 * scale, 8)
  for (const p of participants) {
    const bx = Number(sx(p.x + PW_SRC / 2)) - bw / 2
    const by = Number(sy(60))
    els.push(`<rect x="${bx}" y="${by}" width="${bw}" height="${bh}" rx="2" fill="rgba(99,102,241,0.12)" stroke="rgba(99,102,241,0.4)" stroke-width="0.8"/>`)
    if (bw > 30) {
      const label = p.label.replace(/^:/, '').slice(0, 10)
      els.push(`<text x="${bx + bw / 2}" y="${by + bh / 2 + 2.5}" text-anchor="middle" font-size="${Math.min(6, bh * 0.6).toFixed(1)}" fill="rgba(99,102,241,0.7)">${label}</text>`)
    }
  }

  // Messages
  for (const m of messages) {
    const fromP = participants.find(p => p.id === m.from)
    const toP = participants.find(p => p.id === m.to)
    if (!fromP || !toP) continue
    const x1 = Number(sx(fromP.x + PW_SRC / 2))
    const x2 = Number(sx(toP.x + PW_SRC / 2))
    const my = Number(sy(m.y))
    const isReturn = m.type === 'return'
    const color = isReturn ? 'rgba(167,139,250,0.5)' : 'rgba(99,102,241,0.5)'
    const dash = isReturn ? ' stroke-dasharray="3 2"' : ''
    els.push(`<line x1="${x1}" y1="${my}" x2="${x2}" y2="${my}" stroke="${color}" stroke-width="0.8"${dash} marker-end="url(#prev-arr)"/>`)
  }

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">`,
    '<defs>',
    '<marker id="prev-arr" markerWidth="5" markerHeight="5" refX="3" refY="2.5" orient="auto">',
    '<path d="M0,0 L0,5 L5,2.5 z" fill="rgba(99,102,241,0.5)"/>',
    '</marker>',
    '</defs>',
    ...els,
    '</svg>',
  ].join('\n')
}

/* ── Generic preview from flow_data ────────────────────────────── */

export function generatePreviewFromFlowData(
  diagramType: string,
  flowData: Record<string, unknown>,
): string {
  if (diagramType === 'uml_sequence') {
    const participants = Array.isArray(flowData.participants) ? flowData.participants : []
    const messages = Array.isArray(flowData.messages) ? flowData.messages : []
    return generateSequencePreview({
      participants: participants as SeqPrev['participants'],
      messages: messages as SeqPrev['messages'],
    })
  }

  const nodes = Array.isArray(flowData.nodes) ? flowData.nodes as Node[] : []
  const edges = Array.isArray(flowData.edges) ? flowData.edges as Edge[] : []
  return generatePreviewSvg(nodes, edges)
}
