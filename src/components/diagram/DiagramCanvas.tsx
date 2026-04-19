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
import { SeqParticipantNode } from '@/components/diagram/nodes/sequence/SeqParticipantNode'
import { SeqMessageNode } from '@/components/diagram/nodes/sequence/SeqMessageNode'
import { SeqFragmentNode } from '@/components/diagram/nodes/sequence/SeqFragmentNode'
import { SeqActivationNode } from '@/components/diagram/nodes/sequence/SeqActivationNode'
import { FcStartNode } from '@/components/diagram/nodes/flowchart/FcStartNode'
import { FcEndNode } from '@/components/diagram/nodes/flowchart/FcEndNode'
import { FcProcessNode } from '@/components/diagram/nodes/flowchart/FcProcessNode'
import { FcDecisionNode } from '@/components/diagram/nodes/flowchart/FcDecisionNode'
import { FcDataNode } from '@/components/diagram/nodes/flowchart/FcDataNode'
import { FcSubprocessNode } from '@/components/diagram/nodes/flowchart/FcSubprocessNode'
import { C4PersonNode } from '@/components/diagram/nodes/c4/C4PersonNode'
import { C4ContainerNode } from '@/components/diagram/nodes/c4/C4ContainerNode'
import { C4BoundaryNode } from '@/components/diagram/nodes/c4/C4BoundaryNode'
import { C4SystemExtNode } from '@/components/diagram/nodes/c4/C4SystemExtNode'
import { ErdEntityNode } from '@/components/diagram/nodes/erd/ErdEntityNode'
import { DiagramTopBar } from '@/components/diagram/DiagramTopBar'
import { PromptPanel } from '@/components/diagram/PromptPanel'
import { UmlClassPanel } from '@/components/diagram/UmlClassPanel'
import { GenerationLoader } from '@/components/shared/GenerationLoader'
import { FeatureUpgradeModal } from '@/components/shared/FeatureUpgradeModal'
import { parseFlowData } from '@/lib/diagram'
import { generatePreviewSvg } from '@/lib/diagram/generatePreviewSvg'
import { fixBpmnLayout } from '@/lib/diagram/bpmn/fixBpmnLayout'
import { generateBpmnXml } from '@/lib/diagram/bpmn/generateBpmnXml'
import { parseBpmnXml } from '@/lib/diagram/bpmn/parseBpmnXml'
import { Eye, Columns, Code2, Copy, Check, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { saveVersion } from '@/lib/diagram/versions'
import { HistoryPanel } from '@/components/diagram/HistoryPanel'
import { FeedbackBar } from '@/components/diagram/FeedbackBar'
import { useTheme } from '@/lib/theme/ThemeProvider'

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
  seqParticipant: SeqParticipantNode,
  seqMessage: SeqMessageNode,
  seqFragment: SeqFragmentNode,
  seqActivation: SeqActivationNode,
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
  'erd-entity': ErdEntityNode,
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
  userPlan?: string
  userId?: string
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
  userPlan,
  userId = '',
}: DiagramCanvasProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const reactFlowInstance = useReactFlow()
  const [nodes, setNodes, onNodesChange] = useNodesState(
    diagramType === 'bpmn' ? fixBpmnLayout(initialNodes as Parameters<typeof fixBpmnLayout>[0]) as typeof initialNodes : initialNodes
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)
  const [title, setTitle] = useState(initialTitle)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | null>(
    'saved'
  )
  const [regenerating, setRegenerating] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'visual' | 'split' | 'code'>('visual')
  const [codeText, setCodeText] = useState('')
  const [codeError, setCodeError] = useState<string | null>(null)
  const [codeCopied, setCodeCopied] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const codeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isBpmn = diagramType === 'bpmn'
  const isFlowchart = diagramType === 'flowchart'

  useEffect(() => {
    if (nodes.length > 0 && reactFlowInstance) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.15, duration: 400 })
      }, 100)
      return () => clearTimeout(timer)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (isBpmn && (viewMode === 'code' || viewMode === 'split')) {
      setCodeText(generateBpmnXml(nodes, edges, title))
      setCodeError(null)
    }
  }, [viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleCodeChange(text: string) {
    setCodeText(text)
    if (codeDebounceRef.current) clearTimeout(codeDebounceRef.current)
    codeDebounceRef.current = setTimeout(() => {
      try {
        const { nodes: parsed, edges: parsedEdges } = parseBpmnXml(text)
        if (parsed.length === 0) {
          setCodeError('No BPMN elements found — check XML structure')
          return
        }
        const existingPos = new Map(
          nodes.map((n) => [n.id, n.position] as const)
        )
        const mergedNodes = parsed.map((n) => {
          const prev = existingPos.get(n.id)
          if (prev && Number.isFinite(prev.x) && Number.isFinite(prev.y)) {
            return { ...n, position: { x: prev.x, y: prev.y } }
          }
          return n
        })
        const normalized = parseFlowData({
          nodes: mergedNodes as Parameters<typeof parseFlowData>[0]['nodes'],
          edges: parsedEdges as Parameters<typeof parseFlowData>[0]['edges'],
        })
        setCodeError(null)
        setNodes(normalized.nodes as typeof nodes)
        setEdges(normalized.edges as typeof edges)
        debouncedSave()
      } catch (e) {
        setCodeError(e instanceof Error ? e.message : 'Invalid BPMN XML')
      }
    }, 500)
  }

  function handleCopyCode() {
    navigator.clipboard.writeText(codeText)
    setCodeCopied(true)
    setTimeout(() => setCodeCopied(false), 2000)
  }

  const saveToSupabase = useCallback(async () => {
    setSaveStatus('saving')
    const supabase = createClient()
    const preview_svg = generatePreviewSvg(nodes, edges)
    await supabase
      .from('diagrams')
      .update({
        title,
        flow_data: { nodes, edges },
        preview_svg: preview_svg || null,
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
    // Defensive fallbacks — ensure API call always has valid values
    const promptToUse = newPrompt?.trim()
      || initialPrompt?.trim()
      || title?.replace(/^Code Lens\s*[—-]\s*/i, '').trim()
      || 'Generate a diagram'
    const typeToUse = newDiagramType?.trim() || diagramType?.trim() || 'flowchart'

    // 1. Save current state as "Before regeneration" version FIRST
    await saveVersion(
      diagramId,
      { nodes, edges, diagramType, title },
      `Before regeneration · ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
    )

    setRegenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagramType: typeToUse,
          prompt: promptToUse,
          existingDiagramId: diagramId, // update in-place — keeps version history on same diagram
        }),
      })

      if (res.status === 403) {
        const payload = await res.json().catch(() => ({}))
        if (payload?.feature === 'update_diagram_ai') {
          setUpgradeModalOpen(true)
        } else {
          toast.error(
            "You've used all your monthly generations. Upgrade to keep going.",
            { action: { label: 'Upgrade', onClick: () => router.push('/settings') } }
          )
        }
        setRegenerating(false)
        return
      }

      if (!res.ok) throw new Error('Generation failed')

      const data = await res.json()
      // 2. Apply new nodes/edges in-place — no navigation, no lost history
      const rawFlow = data.flowData as { nodes?: unknown[]; edges?: unknown[] }
      const normalizedRawFlow =
        typeToUse === 'bpmn'
          ? {
              nodes: fixBpmnLayout((rawFlow.nodes ?? []) as Parameters<typeof fixBpmnLayout>[0]),
              edges: rawFlow.edges ?? [],
            }
          : rawFlow
      const { nodes: newNodes, edges: newEdges } = parseFlowData(
        normalizedRawFlow as Parameters<typeof parseFlowData>[0]
      )
      setNodes(newNodes)
      setEdges(newEdges)
      setRegenerating(false)
      toast.success('Diagram regenerated')
    } catch {
      toast.error('Something went wrong. Please try again.')
      setRegenerating(false)
    }
  }

  async function handleRestoreVersion(snapshot: Record<string, unknown>) {
    // Save current state before overwriting
    await saveVersion(diagramId, { nodes, edges, diagramType, title }, 'Before restore')

    const restoredNodesRaw = Array.isArray(snapshot.nodes) ? snapshot.nodes as typeof nodes : nodes
    const restoredEdges = Array.isArray(snapshot.edges) ? snapshot.edges as typeof edges : edges
    const restoredNodes =
      diagramType === 'bpmn'
        ? (parseFlowData({
            nodes: fixBpmnLayout(restoredNodesRaw as Parameters<typeof fixBpmnLayout>[0]) as Parameters<typeof parseFlowData>[0]['nodes'],
            edges: restoredEdges as Parameters<typeof parseFlowData>[0]['edges'],
          }).nodes as typeof nodes)
        : restoredNodesRaw
    setNodes(restoredNodes)
    setEdges(restoredEdges)

    const supabase = createClient()
    await supabase
      .from('diagrams')
      .update({ flow_data: { nodes: restoredNodes, edges: restoredEdges } })
      .eq('id', diagramId)

    toast.success('Version restored')
  }

  if (regenerating) {
    return <GenerationLoader />
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    borderRadius: 6, border: 'none', transition: 'all 0.15s',
    background: active ? 'var(--color-accent-subtle, rgba(99,102,241,0.15))' : 'transparent',
    color: active ? 'var(--color-accent-brand, #818CF8)' : 'var(--color-text-secondary, #94A3B8)',
  })

  const showCodePane = isBpmn && (viewMode === 'code' || viewMode === 'split')
  const showVisualPane = !isBpmn || viewMode === 'visual' || viewMode === 'split'

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
        userPlan={userPlan}
        onHistoryOpen={() => setHistoryOpen(true)}
      />
      <HistoryPanel
        diagramId={diagramId}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestore={handleRestoreVersion}
      />
      {/* Tabs — only for BPMN */}
      {isBpmn && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '6px 16px',
          borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.06))',
          background: 'var(--color-surface, #111)',
        }}>
          <button style={tabStyle(viewMode === 'visual')} onClick={() => setViewMode('visual')}>
            <Eye size={14} /> Visual
          </button>
          <button style={tabStyle(viewMode === 'split')} onClick={() => setViewMode('split')}>
            <Columns size={14} /> Split
          </button>
          <button style={tabStyle(viewMode === 'code')} onClick={() => setViewMode('code')}>
            <Code2 size={14} /> Code
          </button>
        </div>
      )}

      <div className="relative flex-1" style={{ display: 'flex', overflow: 'hidden' }}>
        {/* Visual pane */}
        {showVisualPane && (
          <div
            className={
              diagramType === 'c4_l1' || diagramType === 'c4_l2' ? 'c4-canvas c4-diagram' :
              isFlowchart ? 'flowchart-canvas' :
              diagramType === 'erd' ? 'erd-diagram' : undefined
            }
            data-mode={isFlowchart ? 'view' : undefined}
            style={{
              flex: isBpmn && viewMode === 'split' ? 1 : undefined,
              width: !isBpmn || viewMode === 'visual' ? '100%' : undefined,
              position: 'relative', height: '100%',
            }}
          >
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
              snapToGrid={true}
              snapGrid={[15, 15]}
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
                maskColor={isDark ? 'rgba(9,9,11,0.75)' : 'rgba(240,240,248,0.75)'}
                style={{
                  background: isDark ? '#0F0F17' : '#F8FAFC',
                  border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#E4E4E7'}`,
                  borderRadius: 8,
                }}
              />
            </ReactFlow>

            <PromptPanel
              initialPrompt={initialPrompt ?? ''}
              diagramType={diagramType}
              onRegenerate={handleRegenerate}
              diagramId={diagramId}
              flowData={{ nodes, edges }}
              userPlan={userPlan}
              onDiagramUpdate={(fd) => {
                const rawFlow = fd as { nodes?: unknown[]; edges?: unknown[] }
                const normalizedRawFlow =
                  diagramType === 'bpmn'
                    ? {
                        nodes: fixBpmnLayout(
                          (rawFlow.nodes ?? []) as Parameters<typeof fixBpmnLayout>[0]
                        ),
                        edges: rawFlow.edges ?? [],
                      }
                    : rawFlow
                const { nodes: newNodes, edges: newEdges } = parseFlowData(
                  normalizedRawFlow as Parameters<typeof parseFlowData>[0]
                )
                setNodes(newNodes)
                setEdges(newEdges)
                debouncedSave()
              }}
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
        )}

        {/* Code pane — BPMN XML */}
        {showCodePane && (
          <div style={{
            flex: viewMode === 'split' ? 1 : undefined,
            width: viewMode === 'code' ? '100%' : undefined,
            display: 'flex', flexDirection: 'column',
            borderLeft: viewMode === 'split' ? '1px solid var(--color-border, rgba(255,255,255,0.06))' : 'none',
            background: 'var(--color-surface, #111)',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.06))',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                BPMN 2.0 XML
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {codeError && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#F87171' }}>
                    <AlertCircle size={12} /> {codeError}
                  </span>
                )}
                <button
                  onClick={handleCopyCode}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', fontSize: 11, fontWeight: 500,
                    borderRadius: 4, border: '1px solid var(--color-border)',
                    background: 'transparent', cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {codeCopied ? <Check size={12} /> : <Copy size={12} />}
                  {codeCopied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div style={{
              padding: '6px 12px',
              fontSize: 10, color: 'var(--color-text-secondary, #64748B)',
              borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.04))',
            }}>
              Compatible with Camunda, bpmn.io, and any BPMN 2.0 tool
            </div>

            <textarea
              value={codeText}
              onChange={e => handleCodeChange(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1, resize: 'none', padding: 16,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontSize: 12, lineHeight: 1.6, tabSize: 2,
                background: 'transparent',
                color: 'var(--color-text-primary, #E2E8F0)',
                border: 'none', outline: 'none',
                borderLeft: codeError ? '3px solid #F87171' : '3px solid transparent',
              }}
            />
          </div>
        )}
      </div>

      {/* Feedback bar — low visual weight, bottom-left */}
      {userId && (
        <div style={{
          height: 36, display: 'flex', alignItems: 'center',
          padding: '0 16px',
          borderTop: '1px solid var(--color-border, rgba(255,255,255,0.04))',
          background: 'var(--color-surface, #111)',
          flexShrink: 0,
        }}>
          <FeedbackBar
            key={diagramId}
            diagramId={diagramId}
            diagramType={diagramType}
            userId={userId}
          />
        </div>
      )}
      <FeatureUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        featureName="Update Diagram with AI"
        requiredPlan="basic"
      />
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
