export type DiagramType =
  | 'bpmn'
  | 'uml_sequence'
  | 'flowchart'
  | 'c4_l1'
  | 'c4_l2'
  | 'api_lens'
  // Legacy types — kept for existing diagrams in DB
  | 'user_flow'
  | 'uml_class'
  | 'erd'
  | 'c4'

export type BpmnNodeType =
  | 'bpmnTask'
  | 'bpmnGateway'
  | 'bpmnStartEvent'
  | 'bpmnEndEvent'
  | 'bpmnPool'
  | 'bpmnLane'

export type UserFlowNodeType = 'ufScreen' | 'ufDecision' | 'ufAction'

export type UmlNodeType = 'umlClass'

export type SeqNodeType =
  | 'seqParticipant'
  | 'seqMessage'
  | 'seqFragment'
  | 'seqActivation'

export type ErdNodeType = 'erdEntity'

export type FcNodeType =
  | 'fcStart'
  | 'fcEnd'
  | 'fcProcess'
  | 'fcDecision'
  | 'fcData'
  | 'fcSubprocess'

export type C4NodeType =
  | 'c4Person'
  | 'c4Container'
  | 'c4Boundary'
  | 'c4SystemExt'

export type ApiLensNodeType = 'apiLensService'

export type CustomNodeType =
  | BpmnNodeType
  | UserFlowNodeType
  | UmlNodeType
  | SeqNodeType
  | ErdNodeType
  | FcNodeType
  | C4NodeType
  | ApiLensNodeType

export interface Folder {
  id: string
  user_id: string
  name: string
  color: string
  created_at: string
}

export interface DiagramSummary {
  id: string
  title: string
  diagram_type: DiagramType
  created_at: string
  updated_at: string
  preview_svg: string | null
  folder_id: string | null
  public_slug: string | null
}

export interface DiagramNode {
  id: string
  type: CustomNodeType
  position: { x: number; y: number }
  data: { label: string }
}

export interface DiagramEdge {
  id: string
  source: string
  target: string
  label?: string
}

export interface FlowData {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

export interface GenerateRequest {
  diagramType: DiagramType
  prompt: string
}

export interface GenerateResponse {
  diagramId: string
  flowData: FlowData
}
