import type { Node, Edge } from '@xyflow/react'

interface UmlAttribute {
  visibility: string
  name: string
  type: string
}

interface UmlMethod {
  visibility: string
  name: string
  params: string
  returnType: string
}

interface UmlClassData {
  name: string
  stereotype?: string | null
  attributes?: UmlAttribute[]
  methods?: UmlMethod[]
}

const RELATIONSHIP_MAP: Record<string, string> = {
  uml_inheritance: '--|>',
  uml_implementation: '..|>',
  uml_association: '-->',
  uml_aggregation: 'o--',
  uml_composition: '*--',
  uml_dependency: '..>',
}

export function generatePlantUML(nodes: Node[], edges: Edge[]): string {
  const lines: string[] = ['@startuml', '']

  lines.push('skinparam classAttributeIconSize 0')
  lines.push('skinparam monochrome true')
  lines.push('')

  const classNodes = nodes.filter((n) => n.type === 'umlClass')

  for (const node of classNodes) {
    const { name, stereotype, attributes, methods } = node.data as UmlClassData

    if (stereotype === '<<interface>>') {
      lines.push(`interface ${name} {`)
    } else if (stereotype === '<<abstract>>') {
      lines.push(`abstract class ${name} {`)
    } else if (stereotype === '<<enum>>') {
      lines.push(`enum ${name} {`)
    } else {
      lines.push(`class ${name} {`)
    }

    if (attributes && attributes.length > 0) {
      for (const attr of attributes) {
        lines.push(`  ${attr.visibility}${attr.name} : ${attr.type}`)
      }
    }

    if (
      attributes &&
      attributes.length > 0 &&
      methods &&
      methods.length > 0
    ) {
      lines.push('  --')
    }

    if (methods && methods.length > 0) {
      for (const method of methods) {
        lines.push(
          `  ${method.visibility}${method.name}(${method.params}) : ${method.returnType}`
        )
      }
    }

    lines.push('}')
    lines.push('')
  }

  for (const edge of edges) {
    const umlType = (edge.data as Record<string, unknown>)?.umlType as string | undefined
    const rawType = umlType ?? edge.type ?? ''
    const symbol = RELATIONSHIP_MAP[rawType] || '-->'
    const sourceNode = classNodes.find((n) => n.id === edge.source)
    const targetNode = classNodes.find((n) => n.id === edge.target)
    if (!sourceNode || !targetNode) continue

    const srcName = (sourceNode.data as UmlClassData).name
    const tgtName = (targetNode.data as UmlClassData).name
    const label = edge.label ? ` : ${edge.label}` : ''
    lines.push(`${srcName} ${symbol} ${tgtName}${label}`)
  }

  lines.push('')
  lines.push('@enduml')

  return lines.join('\n')
}
