'use client'

import {
  ReactFlow,
  Background,
  Controls,
  MarkerType,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { SequenceRenderer, type SequenceData } from '@/components/diagram/sequence/SequenceRenderer'
import { BpmnTaskNode } from '@/components/diagram/nodes/BpmnTaskNode'
import { BpmnGatewayNode } from '@/components/diagram/nodes/BpmnGatewayNode'
import { BpmnStartEventNode } from '@/components/diagram/nodes/BpmnStartEventNode'
import { BpmnEndEventNode } from '@/components/diagram/nodes/BpmnEndEventNode'
import { BpmnPoolNode } from '@/components/diagram/nodes/BpmnPoolNode'
import { BpmnLaneNode } from '@/components/diagram/nodes/BpmnLaneNode'
import { FcStartNode } from '@/components/diagram/nodes/flowchart/FcStartNode'
import { FcEndNode } from '@/components/diagram/nodes/flowchart/FcEndNode'
import { FcProcessNode } from '@/components/diagram/nodes/flowchart/FcProcessNode'
import { FcDecisionNode } from '@/components/diagram/nodes/flowchart/FcDecisionNode'
import { FcDataNode } from '@/components/diagram/nodes/flowchart/FcDataNode'
import { FcSubprocessNode } from '@/components/diagram/nodes/flowchart/FcSubprocessNode'
import { C4PersonNode } from '@/components/diagram/nodes/c4/C4PersonNode'
import { C4ContainerNode } from '@/components/diagram/nodes/c4/C4ContainerNode'
import { C4SystemExtNode } from '@/components/diagram/nodes/c4/C4SystemExtNode'
import { C4BoundaryNode } from '@/components/diagram/nodes/c4/C4BoundaryNode'
import { ErdEntityNode } from '@/components/diagram/nodes/erd/ErdEntityNode'
import {
  ApiLensShell,
  type ApiLensConnection,
  type ApiLensService,
} from '@/components/diagram/ApiLensShell'

const nodeTypes = {
  // camelCase (stored in DB by editor) — PRIMARY
  bpmnTask: BpmnTaskNode,
  bpmnGateway: BpmnGatewayNode,
  bpmnStartEvent: BpmnStartEventNode,
  bpmnEndEvent: BpmnEndEventNode,
  bpmnPool: BpmnPoolNode,
  bpmnLane: BpmnLaneNode,
  fcStart: FcStartNode,
  fcEnd: FcEndNode,
  fcProcess: FcProcessNode,
  fcDecision: FcDecisionNode,
  fcData: FcDataNode,
  fcSubprocess: FcSubprocessNode,
  c4Person: C4PersonNode,
  c4Container: C4ContainerNode,
  c4Boundary: C4BoundaryNode,
  c4SystemExt: C4SystemExtNode,
  // kebab-case aliases (legacy/embed)
  'bpmn-task': BpmnTaskNode,
  'bpmn-gateway': BpmnGatewayNode,
  'bpmn-start': BpmnStartEventNode,
  'bpmn-end': BpmnEndEventNode,
  'bpmn-pool': BpmnPoolNode,
  'bpmn-lane': BpmnLaneNode,
  'fc-start': FcStartNode,
  'fc-end': FcEndNode,
  'fc-process': FcProcessNode,
  'fc-decision': FcDecisionNode,
  'fc-data': FcDataNode,
  'fc-subprocess': FcSubprocessNode,
  'c4-person': C4PersonNode,
  'c4-internal': C4ContainerNode,
  'c4-external': C4SystemExtNode,
  'c4-boundary': C4BoundaryNode,
  'erd-entity': ErdEntityNode,
}

export type EmbedViewerApiLensData = {
  services: unknown[]
  connections: unknown[]
  c4l1_positions?: Record<string, { x: number; y: number }> | null
  c4l2_positions?: Record<string, { x: number; y: number }> | null
}

interface EmbedViewerProps {
  title: string
  diagramType: string
  sequenceData: SequenceData | null
  nodes: unknown[]
  edges: unknown[]
  /** Set for public API Lens shares (`diagram_type === 'api_lens'`) */
  apiLensData?: EmbedViewerApiLensData | null
}

export function EmbedViewer({
  title,
  diagramType,
  sequenceData,
  nodes,
  edges,
  apiLensData = null,
}: EmbedViewerProps) {
  if (diagramType === 'api_lens' && apiLensData) {
    return (
      <div style={{ width: '100%', height: '100%', minHeight: '100vh' }}>
        <ApiLensShell
          services={apiLensData.services as ApiLensService[]}
          connections={apiLensData.connections as ApiLensConnection[]}
          diagramTitle={title}
          readOnly
          c4l1Positions={apiLensData.c4l1_positions ?? null}
          c4l2Positions={apiLensData.c4l2_positions ?? null}
        />
      </div>
    )
  }

  if (diagramType === 'SEQUENCE' && sequenceData) {
    return (
      <div
        style={{
          width: '100%',
          height: '100vh',
          overflow: 'auto',
          padding: '24px 32px',
          boxSizing: 'border-box',
        }}
      >
        <SequenceRenderer data={sequenceData} readOnly />
      </div>
    )
  }

  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <ReactFlow
        nodes={nodes as Node[]}
        edges={edges as Edge[]}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15, minZoom: 0.3, maxZoom: 1.5 }}
        minZoom={0.1}
        maxZoom={2}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={false}
        panOnDrag
        zoomOnScroll
        proOptions={{ hideAttribution: true }}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: 'var(--color-diagram-edge)', strokeWidth: 1.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            width: 16,
            height: 16,
            color: 'var(--color-diagram-edge)',
          },
        }}
      >
        <Background color="var(--color-diagram-grid)" gap={20} size={1} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  )
}
