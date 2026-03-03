/**
 * Single source of truth for diagram types shown in the UI.
 * Import this wherever a user-facing list of diagram types is needed.
 */
export const DIAGRAM_TYPES = [
  { value: 'bpmn',         label: 'BPMN 2.0',      description: 'Business process flows', color: '#6366F1' },
  { value: 'uml_sequence', label: 'UML Sequence',   description: 'System interactions',    color: '#22C55E' },
  { value: 'erd',          label: 'ERD',            description: 'Database schema',        color: '#3B82F6' },
  { value: 'flowchart',    label: 'Flowchart',      description: 'Decision flows',         color: '#F59E0B' },
  { value: 'c4_l1',        label: 'C4 Model (L1)',  description: 'System context',         color: '#A78BFA' },
  { value: 'c4_l2',        label: 'C4 Model (L2)',  description: 'Container diagram',      color: '#8B5CF6' },
] as const

export type DiagramTypeValue = typeof DIAGRAM_TYPES[number]['value']

/**
 * Maps legacy diagram type values (stored in older DB records) to current canonical values.
 * Applied when reading diagramType from the database before pre-filling any UI control.
 */
const LEGACY_TYPE_MAP: Record<string, DiagramTypeValue> = {
  user_flow:    'flowchart',
  flow:         'flowchart',
  c4:           'c4_l1',
  sequence:     'uml_sequence',
  uml_class:    'erd',
}

export function normalizeType(type: string): DiagramTypeValue {
  const mapped = LEGACY_TYPE_MAP[type]
  if (mapped) return mapped
  const isCanonical = DIAGRAM_TYPES.some(d => d.value === type)
  return (isCanonical ? type : 'bpmn') as DiagramTypeValue
}
