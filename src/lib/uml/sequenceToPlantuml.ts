import type { Node, Edge } from '@xyflow/react'

export function sequenceToPlantuml(nodes: Node[], edges: Edge[]): string {
  const participants = nodes.filter(n => n.type === 'seqParticipant')
  const fragments = nodes.filter(n => n.type === 'seqFragment')
  const messages = nodes.filter(n => n.type === 'seqMessage')

  const lines: string[] = ['@startuml', '']

  // Skinparam
  lines.push(
    'skinparam backgroundColor #0D0D10',
    'skinparam sequenceArrowThickness 1.5',
    'skinparam roundcorner 6',
    'skinparam sequenceParticipantBorderColor #6366F1',
    'skinparam sequenceParticipantBackgroundColor #1E1B4B',
    'skinparam sequenceParticipantFontColor #C4B5FD',
    'skinparam sequenceArrowColor #818CF8',
    'skinparam sequenceMessageAlignment center',
    '',
  )

  // Participants
  for (const p of participants) {
    const label = String((p.data as Record<string, unknown>).label ?? 'Participant')
    lines.push(`participant "${label}" as ${p.id}`)
  }

  lines.push('')

  // Messages via edges
  for (const edge of edges) {
    const srcNode = participants.find(p => p.id === edge.source)
    const tgtNode = participants.find(p => p.id === edge.target)
    if (!srcNode || !tgtNode) continue

    const msgNode = messages.find(m => m.id === edge.id || m.id === `msg-${edge.id}`)
    const isReturn = msgNode ? (msgNode.data as Record<string, unknown>).isReturn === true : false
    const label = String(edge.label ?? (msgNode ? (msgNode.data as Record<string, unknown>).label ?? '' : ''))

    const arrow = isReturn ? '-->' : '->'
    lines.push(`${edge.source} ${arrow} ${edge.target}: ${label}`)
  }

  // Fragments
  for (const f of fragments) {
    const kind = String((f.data as Record<string, unknown>).kind ?? 'loop')
    const label = String((f.data as Record<string, unknown>).label ?? '')
    lines.push(`${kind} ${label}`)
    lines.push('  ...') // placeholder
    lines.push(`end`)
  }

  lines.push('', '@enduml')
  return lines.join('\n')
}
