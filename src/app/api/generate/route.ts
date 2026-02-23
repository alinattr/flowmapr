import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const BPMN_PROMPT = `You are a BPMN 2.0 diagram expert. Output ONLY valid JSON. No markdown, no explanation, no code blocks.

NODES — use exactly these types:
- bpmnStartEvent: exactly one per diagram. Represents what triggers the process.
- bpmnEndEvent: one per distinct termination. Happy path gets one. Each dead-end exception gets its own.
- bpmnTask: any work activity. Label should be verb + noun ("Submit Report", "Review Application").
- bpmnGateway: any decision OR merge point. Always set data.gatewayType: "xor" (decision/split) or "parallel" (merge/join).
- bpmnPool: exactly one, wraps the entire diagram. Label = process name derived from the description.
- bpmnLane: horizontal swimlane inside the pool. One per participant/role/department. See SWIMLANES section.

LAYOUT ALGORITHM — apply this logic for every diagram:

Step 1. Identify the happy path: the sequence of steps when everything goes right. These go left-to-right at y=280. Start at x=100. Increment x by 200 for each node.

Step 2. For each gateway on the happy path, identify exception branches (paths that deviate). Assign each exception branch its own y level:
  - First exception branch from any gateway: y=480
  - Second exception branch from any gateway: y=660
  - Third: y=840
  Each exception node's x should align with or be slightly right of the gateway it branches from.

Step 3. If an exception branch eventually rejoins the happy path, place a parallel merge gateway (+) back on y=280 at the appropriate x position. Connect exception nodes back up to it.

Step 4. If an exception branch does NOT rejoin (it terminates), end it with a bpmnEndEvent at exception_node_x + 190, same y as the exception node.

Step 5. Never place two nodes at the same x,y. Minimum 60px clearance between any two nodes in any direction.

Step 6. Pool dimensions: x=20, y=20. width = (x of rightmost node + node_width + 120). height = (y of lowest node + node_height + 120). Never let the pool be smaller than its contents.

EDGE RULES:
- Every edge leaving a gateway MUST have a label. Use domain-appropriate terms: Yes/No, Approved/Rejected, In Stock/Out of Stock, Success/Failure, etc.
- Edges going right (main flow): sourceHandle: "right"
- Edges going down (exception): sourceHandle: "bottom"
- Edges going back up to merge: targetHandle: "bottom" on the merge gateway
- Merge gateway incoming edges: no label needed
- All other edges: no label needed

GATEWAY SYMBOL RULES:
- XOR gateway (decision): data.gatewayType: "xor" — render with X symbol
- Parallel gateway (merge): data.gatewayType: "parallel" — render with + symbol
- Never use a gateway just to make the diagram look symmetric. Only add a gateway when there is actual branching or merging logic.

OUTPUT FORMAT — strictly:
{
  "type": "bpmn",
  "hasSwimlanes": false,
  "nodes": [
    { "id": "pool", "type": "bpmnPool", "position": { "x": 20, "y": 20 }, "data": { "label": "string", "width": number, "height": number } },
    { "id": "string", "type": "bpmnLane", "position": { "x": 56, "y": number }, "data": { "label": "string", "width": number, "height": 180 } },
    { "id": "string", "type": "bpmnStartEvent|bpmnEndEvent|bpmnTask|bpmnGateway", "position": { "x": number, "y": number }, "data": { "label": "string", "gatewayType?": "xor|parallel" } }
  ],
  "edges": [
    { "id": "string", "source": "string", "target": "string", "label?": "string", "sourceHandle?": "right|bottom|left|top", "targetHandle?": "right|bottom|left|top" }
  ]
}

SWIMLANES — when to use:
Use swimlanes when the process involves 2+ distinct participants, roles, departments, or systems. If the description says who does what ("customer submits", "manager reviews"), use swimlanes.
If only one implicit actor, do NOT use swimlanes — use a plain pool.

SWIMLANE COORDINATE SYSTEM (matches the rendered UI exactly):
- Pool position: x=20, y=20. Pool has a 36px left label bar.
- Lanes start at x=56 (pool_x + 36). Each lane has a 32px label bar.
- Content nodes start at x=120 minimum (56 + 32 + padding). Increment x by 190.

SWIMLANE LAYOUT RULES:
1. Identify all participants. Each becomes a lane. Order top-to-bottom by first appearance.
2. Lane height: 180px per lane (all lanes same height in one diagram).
3. Lane y positions (below the 32px pool title bar):
   - Lane 1: y = 52 (pool_y 20 + title bar 32)
   - Lane 2: y = 232 (52 + 180)
   - Lane 3: y = 412 (52 + 360)
   - Formula: lane_y = 52 + (lane_index * 180)
4. Nodes inside a lane:
   - node_y = lane_y + 62 (vertically centered in 180px lane, accounting for node height ~56px)
   - node_x starts at 120, increments by 190
5. Cross-lane edges are allowed. They represent handoffs.
6. Pool height = (number_of_lanes * 180) + 32
7. Pool width = rightmost_node_x + 200

PARALLEL BRANCHES IN SWIMLANES:
1. Split and merge gateways stay in the initiating lane.
2. Branch nodes in other lanes: x between split (S) and merge (S+240). Branch x = S+120.
3. Split→branch edges: sourceHandle "bottom", targetHandle "top"
4. Branch→merge edges: sourceHandle "right", targetHandle "left"
5. Parallel gateway edges do NOT need labels.

LANE NODE FORMAT:
{ "id": "lane_1", "type": "bpmnLane", "position": { "x": 56, "y": LANE_Y }, "data": { "label": "Name", "width": POOL_WIDTH_MINUS_36, "height": 180 } }

Include lane nodes after the pool node and before task/gateway/event nodes.

If hasSwimlanes: true, include lanes. If false, no lane nodes.

QUALITY CHECKLIST — before outputting, verify:
- Exactly one bpmnStartEvent
- At least one bpmnEndEvent
- Every gateway has at least 2 outgoing edges
- Every outgoing gateway edge has a label
- No two nodes share the same x,y position
- Pool width and height contain all nodes with padding
- All edge sourceHandle values are set for gateway outgoing edges
- If swimlanes: every task/event node y is inside the correct lane's y range

Now generate a diagram for the following process.`

const USER_FLOW_PROMPT = `You are a User Flow / Journey Map diagram generator. Given a process description, produce a user-centric flow diagram.

USER FLOW RULES:
- Use "ufScreen" for screens/pages the user sees (e.g. "Login Page", "Dashboard")
- Use "ufDecision" for decision points where the user or system makes a choice (diamonds)
- Use "ufAction" for actions the user takes (e.g. "Click Submit", "Enter email")
- Connect ALL nodes with edges — no orphan nodes
- Label edges with user actions or conditions

Output ONLY valid JSON, no markdown, no explanation:
{ "type": "user_flow", "nodes": [{ "id": string, "type": "ufScreen"|"ufDecision"|"ufAction", "position": { "x": number, "y": number }, "data": { "label": string } }], "edges": [{ "id": string, "source": string, "target": string, "label": string }] }

Position nodes left-to-right. Start x at 100, increment by 250. Main flow y=200, alternate paths y=400.`

const UML_CLASS_PROMPT = `You are a UML Class Diagram expert. Given a description of a system, domain, or feature, generate a UML Class Diagram.
Output ONLY valid JSON. No markdown, no explanation, no code blocks.

UML CLASS DIAGRAM ELEMENTS:

Classes:
- name: PascalCase class name
- attributes: list of { visibility: "+" | "-" | "#", name: string, type: string }
  + = public, - = private, # = protected
- methods: list of { visibility: "+" | "-" | "#", name: string, params: string, returnType: string }
- stereotype: optional "<<interface>>" | "<<abstract>>" | "<<enum>>" | null

Relationships (edges):
- uml_association: plain arrow — "uses" or "has"
- uml_aggregation: hollow diamond — "contains (weak)"
- uml_composition: filled diamond — "contains (strong, lifecycle dependency)"
- uml_inheritance: hollow triangle arrow — "extends"
- uml_implementation: dashed hollow triangle — "implements"
- uml_dependency: dashed arrow — "depends on"

LAYOUT RULES:
- Parent classes / interfaces at top (y=80)
- Child classes below parents (y=360)
- Independent classes in middle rows (y=220)
- x: start at 100, increment by 280 per class
- If more than 4 classes in a row, start new row at y + 300
- Minimum 80px gap between any two class boxes

OUTPUT FORMAT:
{
  "type": "uml_class",
  "nodes": [
    {
      "id": string,
      "type": "umlClass",
      "position": { "x": number, "y": number },
      "data": {
        "name": string,
        "stereotype": "<<interface>>" | "<<abstract>>" | "<<enum>>" | null,
        "attributes": [
          { "visibility": "+"|"-"|"#", "name": string, "type": string }
        ],
        "methods": [
          { "visibility": "+"|"-"|"#", "name": string, "params": string, "returnType": string }
        ]
      }
    }
  ],
  "edges": [
    {
      "id": string,
      "source": string,
      "target": string,
      "type": "uml_association" | "uml_aggregation" | "uml_composition" | "uml_inheritance" | "uml_implementation" | "uml_dependency",
      "label": string
    }
  ]
}

QUALITY CHECKLIST before outputting:
- Every class has at least 1 attribute or 1 method
- Relationship types are semantically correct (inheritance only between classes, implementation only for interfaces)
- No two classes at identical x,y
- Abstract classes and interfaces use stereotype field
- Every edge has a descriptive label (cardinality like "1..*" or relationship name)

Now generate a UML class diagram for the following system.`

function getSystemPrompt(type: string): string {
  if (type === 'bpmn') return BPMN_PROMPT
  if (type === 'uml_class') return UML_CLASS_PROMPT
  return USER_FLOW_PROMPT
}

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { diagramType, prompt } = body as {
    diagramType: string
    prompt: string
  }

  if (!diagramType || !prompt) {
    return NextResponse.json(
      { error: 'Missing diagramType or prompt' },
      { status: 400 }
    )
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('generations_used, monthly_limit')
    .eq('user_id', user.id)
    .single()

  if (!sub || sub.generations_used >= sub.monthly_limit) {
    return NextResponse.json({ error: 'quota_exceeded' }, { status: 402 })
  }

  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

  let flowData: { nodes: unknown[]; edges: unknown[] }

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 4000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(diagramType),
        },
        {
          role: 'user',
          content: `Process description: ${prompt}`,
        },
      ],
    })

    const text = completion.choices[0]?.message?.content
    if (!text) {
      throw new Error('No content in OpenAI response')
    }

    const parsed = JSON.parse(text)
    flowData = { nodes: parsed.nodes, edges: parsed.edges }
  } catch {
    return NextResponse.json(
      { error: 'Failed to generate diagram' },
      { status: 500 }
    )
  }

  const admin = createAdminClient()
  const { data: incremented } = await admin.rpc(
    'increment_generation_counter',
    { p_user_id: user.id }
  )

  if (!incremented) {
    return NextResponse.json({ error: 'quota_exceeded' }, { status: 402 })
  }

  const { data: diagram, error: insertError } = await supabase
    .from('diagrams')
    .insert({
      user_id: user.id,
      title: 'Untitled diagram',
      diagram_type: diagramType,
      flow_data: flowData,
      prompt,
    })
    .select('id')
    .single()

  if (insertError || !diagram) {
    return NextResponse.json(
      { error: 'Failed to save diagram' },
      { status: 500 }
    )
  }

  await supabase.from('generation_log').insert({
    user_id: user.id,
    diagram_id: diagram.id,
    prompt,
    diagram_type: diagramType,
    success: true,
  })

  return NextResponse.json({ diagramId: diagram.id, flowData })
}
