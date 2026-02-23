export type DiagramType = 'bpmn' | 'user_flow' | 'uml_class'

export type BpmnNodeType =
  | 'bpmnTask'
  | 'bpmnGateway'
  | 'bpmnStartEvent'
  | 'bpmnEndEvent'
  | 'bpmnPool'

export type UserFlowNodeType = 'ufScreen' | 'ufDecision' | 'ufAction'

export type UmlNodeType = 'umlClass'

export type CustomNodeType = BpmnNodeType | UserFlowNodeType | UmlNodeType

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
