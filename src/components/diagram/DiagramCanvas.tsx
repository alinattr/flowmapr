'use client'

import { useCallback, useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  addEdge,
  reconnectEdge,
  MarkerType,
  type Node,
  type Edge,
  type Connection,
  type OnNodesChange,
  type OnEdgesChange,
  type OnReconnect,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toast } from 'sonner'
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
import { DiagramTopBar } from '@/components/diagram/DiagramTopBar'
import { PromptPanel } from '@/components/diagram/PromptPanel'
import { UmlClassPanel } from '@/components/diagram/UmlClassPanel'
import { GenerationLoader } from '@/components/shared/GenerationLoader'
import { createClient } from '@/lib/supabase/client'

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

interface DiagramCanvasProps {
  diagramId: string
  initialTitle: string
  initialNodes: Node[]
  initialEdges: Edge[]
  diagramType: string
  prompt: string | null
  generationsRemaining: number
  email: string
  fullName: string | null
  isPublic: boolean
  publicSlug: string | null
}

function DiagramCanvasInner({
  diagramId,
  initialTitle,
  initialNodes,
  initialEdges,
  diagramType,
  prompt: initialPrompt,
  generationsRemaining,
  email,
  fullName,
  isPublic,
  publicSlug,
}: DiagramCanvasProps) {
  const router = useRouter()
  const reactFlowInstance = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [title, setTitle] = useState(initialTitle)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | null>(
    'saved'
  )
  const [regenerating, setRegenerating] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (nodes.length > 0 && reactFlowInstance) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.15, duration: 400 })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveToSupabase = useCallback(async () => {
    setSaveStatus('saving')
    const supabase = createClient()
    await supabase
      .from('diagrams')
      .update({
        title,
        flow_data: { nodes, edges },
      })
      .eq('id', diagramId)
    setSaveStatus('saved')
  }, [title, nodes, edges, diagramId])

  const debouncedSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      saveToSupabase()
    }, 2000)
  }, [saveToSupabase])

  const handleNodesChange: OnNodesChange = useCallback(
    (changes) => {
      onNodesChange(changes)
      debouncedSave()
    },
    [onNodesChange, debouncedSave]
  )

  const handleEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      onEdgesChange(changes)
      debouncedSave()
    },
    [onEdgesChange, debouncedSave]
  )

  const handleConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        type: 'smoothstep',
        style: { stroke: 'var(--color-diagram-edge)', strokeWidth: 1.5 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 16,
          height: 16,
          color: 'var(--color-diagram-edge)',
        },
        reconnectable: true,
      }
      setEdges((eds) => addEdge(newEdge, eds))
      debouncedSave()
    },
    [setEdges, debouncedSave]
  )

  const handleReconnect: OnReconnect = useCallback(
    (oldEdge, newConnection) => {
      setEdges((eds) => reconnectEdge(oldEdge, newConnection, eds))
      debouncedSave()
    },
    [setEdges, debouncedSave]
  )

  async function handleTitleChange(newTitle: string) {
    setTitle(newTitle)
    setSaveStatus('saving')
    const supabase = createClient()
    await supabase
      .from('diagrams')
      .update({ title: newTitle })
      .eq('id', diagramId)
    setSaveStatus('saved')
  }

  async function handleRegenerate(newPrompt: string, newDiagramType: string) {
    setRegenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagramType: newDiagramType,
          prompt: newPrompt,
        }),
      })

      if (res.status === 402) {
        toast.error(
          "You've used all your free generations. Upgrade to keep going.",
          {
            action: {
              label: 'Upgrade',
              onClick: () => router.push('/settings'),
            },
          }
        )
        setRegenerating(false)
        return
      }

      if (!res.ok) throw new Error('Generation failed')

      const data = await res.json()
      router.push(`/diagram/${data.diagramId}`)
    } catch {
      toast.error('Something went wrong. Please try again.')
      setRegenerating(false)
    }
  }

  if (regenerating) {
    return <GenerationLoader />
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      <DiagramTopBar
        diagramId={diagramId}
        title={title}
        onTitleChange={handleTitleChange}
        saveStatus={saveStatus}
        generationsRemaining={generationsRemaining}
        email={email}
        fullName={fullName}
        isPublic={isPublic}
        publicSlug={publicSlug}
        diagramType={diagramType}
        nodes={nodes}
        edges={edges}
      />
      <div className="relative flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={handleNodesChange}
          onEdgesChange={handleEdgesChange}
          onConnect={handleConnect}
          onReconnect={handleReconnect}
          reconnectRadius={25}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15, minZoom: 0.3, maxZoom: 1.5 }}
          minZoom={0.1}
          maxZoom={2}
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
          <Controls />
          <MiniMap
            nodeColor={minimapNodeColor}
            maskColor="rgba(250,250,250,0.8)"
          />
        </ReactFlow>

        <PromptPanel
          initialPrompt={initialPrompt ?? ''}
          diagramType={diagramType}
          onRegenerate={handleRegenerate}
        />

        {diagramType === 'uml_class' &&
          (() => {
            const selected = nodes.find(
              (n) => n.type === 'umlClass' && n.selected
            )
            if (!selected) return null
            return (
              <UmlClassPanel
                selectedNode={selected}
                onDeleteNode={(nodeId) => {
                  setNodes((nds) => nds.filter((n) => n.id !== nodeId))
                  setEdges((eds) =>
                    eds.filter(
                      (e) => e.source !== nodeId && e.target !== nodeId
                    )
                  )
                  debouncedSave()
                }}
              />
            )
          })()}
      </div>
    </div>
  )
}

export function DiagramCanvas(props: DiagramCanvasProps) {
  return (
    <ReactFlowProvider>
      <DiagramCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
