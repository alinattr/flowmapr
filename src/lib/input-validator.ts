/**
 * input-validator.ts
 *
 * Server-side input sanitisation and validation for all AI generation routes.
 * Always run before calling OpenAI — do not trust client-supplied values.
 */

import { DIAGRAM_TYPES as CANONICAL_DIAGRAM_TYPES } from '@/lib/diagram-types'

const CANONICAL_VALUES = CANONICAL_DIAGRAM_TYPES.map(d => d.value)

const ALLOWED_DIAGRAM_TYPES = [
  ...CANONICAL_VALUES,
  // Legacy aliases — kept for backwards compatibility with stored diagrams
  'c4',
  'api_lens',
  'uml_class',
  'user_flow',
  'flow',
  'sequence',
] as const

export type DiagramType = (typeof ALLOWED_DIAGRAM_TYPES)[number]

const MAX_PROMPT_LENGTH = 2000 // Keep aligned with client prompt editors that post to /api/generate
const MIN_PROMPT_LENGTH = 5
const MAX_TITLE_LENGTH = 100

export interface ValidationResult {
  valid: boolean
  error?: string
}

export function validateDiagramType(type: unknown): ValidationResult {
  if (typeof type !== 'string') {
    return { valid: false, error: 'Diagram type must be a string.' }
  }
  if (!ALLOWED_DIAGRAM_TYPES.includes(type as DiagramType)) {
    return { valid: false, error: `Invalid diagram type: "${type}".` }
  }
  return { valid: true }
}

/**
 * Trims to max length and strips null bytes.
 * Never throws — returns empty string on bad input.
 */
export function sanitizePrompt(prompt: unknown): string {
  if (typeof prompt !== 'string') return ''
  return prompt
    .replace(/\0/g, '')            // strip null bytes
    .slice(0, MAX_PROMPT_LENGTH)
    .trim()
}

export function sanitizeTitle(title: unknown): string {
  if (typeof title !== 'string') return 'Untitled'
  return title
    .replace(/\0/g, '')
    .slice(0, MAX_TITLE_LENGTH)
    .trim() || 'Untitled'
}

export function validateRequestBody(body: unknown): ValidationResult {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { valid: false, error: 'Invalid request body.' }
  }

  const { diagramType, prompt } = body as Record<string, unknown>

  const typeCheck = validateDiagramType(diagramType)
  if (!typeCheck.valid) return typeCheck

  if (typeof prompt !== 'string') {
    return { valid: false, error: 'Prompt must be a string.' }
  }

  const trimmed = prompt.trim()
  if (trimmed.length < MIN_PROMPT_LENGTH) {
    return {
      valid: false,
      error: `Prompt is too short (minimum ${MIN_PROMPT_LENGTH} characters).`,
    }
  }

  return { valid: true }
}
