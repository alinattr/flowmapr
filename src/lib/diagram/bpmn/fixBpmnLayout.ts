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
const LANE_NODE_GAP = 36
const RIGHT_PADDING = 80
const BOTTOM_PADDING = 24

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

  // Fix lane positions first (horizontal rows with fixed heights)
  if (lanes.length > 0) {
    const poolX = pool?.position.x ?? 20
    const poolY = pool?.position.y ?? 20
    lanes.forEach((lane, i) => {
      lane.position.x = poolX + POOL_LABEL_W
      lane.position.y = poolY + POOL_TITLE_H + i * LANE_H
      lane.data.height = LANE_H
    })

    const minFlowX = poolX + POOL_LABEL_W + LANE_LABEL_W + 36
    const laneById = new Map(lanes.map((l) => [l.id, l]))
    const laneAssignments = new Map<string, BpmnNode>()

    // 1) Assign each content node to a lane (explicit lane_id first, else closest by y)
    for (const node of content) {
      if (node.position.x < minFlowX) node.position.x = minFlowX

      const explicitLaneId =
        typeof node.data?.lane_id === 'string'
          ? (node.data.lane_id as string)
          : typeof node.data?.laneId === 'string'
            ? (node.data.laneId as string)
            : null

      if (explicitLaneId && laneById.has(explicitLaneId)) {
        laneAssignments.set(node.id, laneById.get(explicitLaneId)!)
        continue
      }

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
      laneAssignments.set(node.id, bestLane)
    }

    // 2) For each lane, enforce left-to-right progression and center vertically
    for (const lane of lanes) {
      const inLane = content
        .filter((n) => laneAssignments.get(n.id)?.id === lane.id)
        .sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y)

      let cursorX = minFlowX
      for (const node of inLane) {
        const { w, h } = nodeSize(node.type)
        node.position.x = Math.max(node.position.x, cursorX)
        node.position.y = lane.position.y + (LANE_H - h) / 2
        cursorX = node.position.x + w + LANE_NODE_GAP
      }
    }
  } else {
    // No explicit lanes: still force an x-flow so generated BPMN doesn't collapse vertically.
    content.sort((a, b) => a.position.x - b.position.x || a.position.y - b.position.y)
    let cursorX = MIN_X
    for (const node of content) {
      const { w } = nodeSize(node.type)
      node.position.x = Math.max(node.position.x, cursorX)
      cursorX = node.position.x + w + LANE_NODE_GAP
      if (node.position.y < 80) node.position.y = 80
    }
  }

  // Resolve residual overlaps conservatively (same-row collisions)
  const rowBucket = (y: number) => Math.round(y / 24)
  const byRow = new Map<number, BpmnNode[]>()
  for (const node of content) {
    const key = rowBucket(node.position.y)
    const row = byRow.get(key) ?? []
    row.push(node)
    byRow.set(key, row)
  }

  for (const rowNodes of byRow.values()) {
    rowNodes.sort((a, b) => a.position.x - b.position.x)
    for (let i = 1; i < rowNodes.length; i++) {
      const prev = rowNodes[i - 1]
      const curr = rowNodes[i]
      const prevRight = prev.position.x + nodeSize(prev.type).w
      const minLeft = prevRight + LANE_NODE_GAP
      if (curr.position.x < minLeft) {
        curr.position.x = minLeft
      }
    }
  }

  // Fix pool and lane dimensions to contain all content
  if (pool) {
    const poolX = pool.position.x
    const poolY = pool.position.y
    const maxX = Math.max(...content.map(n => n.position.x + nodeSize(n.type).w))
    const maxY = Math.max(...content.map(n => n.position.y + nodeSize(n.type).h))

    const poolRight = maxX + RIGHT_PADDING
    const minimumBottomFromLanes =
      lanes.length > 0 ? poolY + POOL_TITLE_H + lanes.length * LANE_H : poolY + 260
    const poolBottom = Math.max(maxY + BOTTOM_PADDING, minimumBottomFromLanes)

    pool.data.width = Math.max(
      poolRight - pool.position.x,
      (pool.data.width as number) ?? 0,
    )
    pool.data.height = Math.max(
      poolBottom - pool.position.y,
      (pool.data.height as number) ?? 0,
    )

    if (lanes.length > 0) pool.data.height = Math.max(pool.data.height as number, POOL_TITLE_H + lanes.length * LANE_H)

    // Fix lane widths to match pool
    const laneW = (pool.data.width as number) - POOL_LABEL_W
    for (const lane of lanes) {
      lane.data.width = laneW
    }
  }

  // ── Wrap pass: snake-layout lanes with more than MAX_NODES_PER_ROW nodes ──
  const MAX_NODES_PER_ROW = 5
  const WRAP_ROW_H = 200
  const WRAP_COL_W = 260
  const WRAP_START_X = 130

  if (lanes.length > 0) {
    // Build lane_id → nodes map using the same lane_id data field checked above
    const nodesByLane = new Map<string, BpmnNode[]>()
    for (const node of content) {
      const laneId =
        typeof node.data?.lane_id === 'string'
          ? (node.data.lane_id as string)
          : typeof node.data?.laneId === 'string'
            ? (node.data.laneId as string)
            : null
      if (!laneId) continue
      if (!nodesByLane.has(laneId)) nodesByLane.set(laneId, [])
      nodesByLane.get(laneId)!.push(node)
    }

    let anyLaneWrapped = false

    for (const [laneId, laneNodes] of nodesByLane) {
      if (laneNodes.length <= MAX_NODES_PER_ROW) continue

      const laneNode = result.find(n => n.id === laneId)
      if (!laneNode) continue

      anyLaneWrapped = true

      // Sort by current x so the existing left-to-right order is preserved
      laneNodes.sort((a, b) => a.position.x - b.position.x)

      const laneBaseY = laneNode.position.y
      const rows = Math.ceil(laneNodes.length / MAX_NODES_PER_ROW)
      const newLaneH = rows * WRAP_ROW_H + 40

      // Re-position each node in snake order
      laneNodes.forEach((node, index) => {
        const row = Math.floor(index / MAX_NODES_PER_ROW)
        const col = index % MAX_NODES_PER_ROW
        const { h } = nodeSize(node.type)
        node.position = {
          x: WRAP_START_X + col * WRAP_COL_W,
          y: laneBaseY + row * WRAP_ROW_H + Math.round((WRAP_ROW_H - h) / 2),
        }
      })

      // Expand the lane to fit the new rows
      laneNode.style = { ...(laneNode.style ?? {}), height: newLaneH }
      laneNode.data = { ...laneNode.data, height: newLaneH }
    }

    // After wrapping, recompute lane y positions (heights may have changed) and pool height
    if (anyLaneWrapped) {
      const poolNode = result.find(n => n.type === 'bpmnPool')
      const poolY = poolNode?.position.y ?? 20

      let cursorY = poolY + POOL_TITLE_H
      for (const lane of lanes) {
        lane.position.y = cursorY
        const lh = (lane.data.height as number) ?? LANE_H
        cursorY += lh
      }

      if (poolNode) {
        const totalLaneH = lanes.reduce(
          (sum, lane) => sum + ((lane.data.height as number) ?? LANE_H),
          0,
        )
        const newPoolH = POOL_TITLE_H + totalLaneH
        poolNode.data = { ...poolNode.data, height: newPoolH }
        poolNode.style = { ...(poolNode.style ?? {}), height: newPoolH }

        // Also ensure pool width covers the wrap columns
        const wrapWidth = WRAP_START_X + MAX_NODES_PER_ROW * WRAP_COL_W + RIGHT_PADDING
        const currentPoolW = (poolNode.data.width as number) ?? 0
        if (wrapWidth > currentPoolW) {
          poolNode.data = { ...poolNode.data, width: wrapWidth }
          poolNode.style = { ...(poolNode.style ?? {}), width: wrapWidth }
          const laneW = wrapWidth - POOL_LABEL_W
          for (const lane of lanes) {
            lane.data = { ...lane.data, width: laneW }
          }
        }
      }
    }
  }

  return result
}
