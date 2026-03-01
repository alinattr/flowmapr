'use client'

import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  MarkerType,
  type Node,
  type Edge,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { BpmnTaskNode } from '@/components/diagram/nodes/BpmnTaskNode'
import { BpmnGatewayNode } from '@/components/diagram/nodes/BpmnGatewayNode'
import { BpmnStartEventNode } from '@/components/diagram/nodes/BpmnStartEventNode'
import { BpmnEndEventNode } from '@/components/diagram/nodes/BpmnEndEventNode'
import { BpmnPoolNode } from '@/components/diagram/nodes/BpmnPoolNode'
import { BpmnLaneNode } from '@/components/diagram/nodes/BpmnLaneNode'
import { UfScreenNode } from '@/components/diagram/nodes/UfScreenNode'
import { UfDecisionNode } from '@/components/diagram/nodes/UfDecisionNode'
import { UfActionNode } from '@/components/diagram/nodes/UfActionNode'
import { UmlClassNode } from '@/components/diagram/nodes/UmlClassNode'
import Link from 'next/link'

const nodeTypes = {
  bpmnTask: BpmnTaskNode,
  bpmnGateway: BpmnGatewayNode,
  bpmnStartEvent: BpmnStartEventNode,
  bpmnEndEvent: BpmnEndEventNode,
  bpmnPool: BpmnPoolNode,
  bpmnLane: BpmnLaneNode,
  ufScreen: UfScreenNode,
  ufDecision: UfDecisionNode,
  ufAction: UfActionNode,
  umlClass: UmlClassNode,
}

function minimapNodeColor(node: Node) {
  if (node.type === 'bpmnStartEvent') return 'var(--color-bpmn-start)'
  if (node.type === 'bpmnEndEvent') return 'var(--color-bpmn-end)'
  if (node.type === 'bpmnGateway') return 'var(--color-bpmn-gateway)'
  if (node.type === 'bpmnTask') return 'var(--color-bpmn-task)'
  if (node.type === 'umlClass') return 'var(--color-accent-subtle)'
  return 'var(--color-diagram-node)'
}

interface ReadOnlyCanvasProps {
  title: string
  nodes: Node[]
  edges: Edge[]
}

export function ReadOnlyCanvas({ title, nodes, edges }: ReadOnlyCanvasProps) {
  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--color-accent-brand)]"
          >
            Flowmapr
          </Link>
          <div className="h-4 w-px bg-[var(--color-border)]" />
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            {title}
          </span>
          <span className="rounded-full bg-[var(--color-accent-subtle)] px-2 py-0.5 text-xs text-[var(--color-text-secondary)]">
            Read-only
          </span>
        </div>
        <Link
          href="/signup"
          className="rounded-md bg-[var(--color-accent-brand)] px-3 py-1.5 text-xs font-medium text-white hover:opacity-90"
        >
          Create your own
        </Link>
      </header>

      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
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
          elevateEdgesOnSelect
          elevateNodesOnSelect={false}
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
          proOptions={{ hideAttribution: true }}
        >
          <Background color="var(--color-diagram-grid)" gap={20} size={1} />
          <Controls showInteractive={false} />
          <MiniMap
            nodeColor={minimapNodeColor}
            maskColor="rgba(250,250,250,0.8)"
          />
        </ReactFlow>
      </div>
    </div>
  )
}
