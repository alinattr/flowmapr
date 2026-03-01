interface BpmnNode {
  id: string
  type: string
  position: { x: number; y: number }
  data: Record<string, unknown>
  style?: Record<string, unknown>
}

const TASK_W = 160
const TASK_H = 56
const GW_SIZE = 52
const EVENT_SIZE = 44
const MIN_X = 120
const COL_GAP = 190
const LANE_H = 140
const LANE_LABEL_W = 32
const POOL_LABEL_W = 36
const POOL_TITLE_H = 32

function nodeSize(type: string): { w: number; h: number } {
  if (type === 'bpmnTask') return { w: TASK_W, h: TASK_H }
  if (type === 'bpmnGateway') return { w: GW_SIZE, h: GW_SIZE }
  if (type === 'bpmnStartEvent' || type === 'bpmnEndEvent') return { w: EVENT_SIZE, h: EVENT_SIZE }
  return { w: TASK_W, h: TASK_H }
}

function isContent(type: string): boolean {
  return !['bpmnPool', 'bpmnLane'].includes(type)
}

export function fixBpmnLayout(nodes: BpmnNode[]): BpmnNode[] {
  const result = nodes.map(n => ({
    ...n,
    position: { ...n.position },
    data: { ...n.data },
  }))

  const pool = result.find(n => n.type === 'bpmnPool')
  const lanes = result
    .filter(n => n.type === 'bpmnLane')
    .sort((a, b) => a.position.y - b.position.y)
  const content = result.filter(n => isContent(n.type))

  if (content.length === 0) return result

  // Fix lane positions if they exist
  if (lanes.length > 0) {
    lanes.forEach((lane, i) => {
      lane.position.x = (pool?.position.x ?? 20) + POOL_LABEL_W
      lane.position.y = (pool?.position.y ?? 20) + POOL_TITLE_H + i * LANE_H
      lane.data.height = LANE_H
    })

    // Assign each content node to its closest lane by y
    for (const node of content) {
      if (node.position.x < MIN_X) node.position.x = MIN_X

      let bestLane = lanes[0]
      let bestDist = Infinity
      for (const lane of lanes) {
        const laneCenterY = lane.position.y + LANE_H / 2
        const dist = Math.abs(node.position.y - laneCenterY)
        if (dist < bestDist) {
          bestDist = dist
          bestLane = lane
        }
      }

      // Center node vertically in its lane
      const { h } = nodeSize(node.type)
      node.position.y = bestLane.position.y + (LANE_H - h) / 2
    }
  }

  // Resolve horizontal overlaps: sort by x, push apart if too close
  content.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y)

  for (let i = 0; i < content.length; i++) {
    for (let j = i + 1; j < content.length; j++) {
      const a = content[i]
      const b = content[j]
      const aSize = nodeSize(a.type)
      const bSize = nodeSize(b.type)

      const dx = Math.abs(b.position.x - a.position.x)
      const dy = Math.abs(b.position.y - a.position.y)
      const minDx = (aSize.w + bSize.w) / 2 + 30
      const minDy = (aSize.h + bSize.h) / 2 + 20

      if (dx < minDx && dy < minDy) {
        // Same lane row — push horizontally
        b.position.x = a.position.x + minDx
      }
    }
  }

  // Fix pool and lane dimensions to contain all content
  if (pool) {
    const maxX = Math.max(...content.map(n => n.position.x + nodeSize(n.type).w))
    const maxY = Math.max(...content.map(n => n.position.y + nodeSize(n.type).h))

    const poolRight = maxX + 60
    const poolBottom = maxY + 60

    pool.data.width = Math.max(
      poolRight - pool.position.x,
      (pool.data.width as number) ?? 0,
    )
    pool.data.height = Math.max(
      poolBottom - pool.position.y,
      (pool.data.height as number) ?? 0,
    )

    if (lanes.length > 0) {
      const totalLaneH = lanes.length * LANE_H
      pool.data.height = Math.max(pool.data.height as number, totalLaneH + POOL_TITLE_H)
    }

    // Fix lane widths to match pool
    const laneW = (pool.data.width as number) - POOL_LABEL_W
    for (const lane of lanes) {
      lane.data.width = laneW
    }
  }

  return result
}
