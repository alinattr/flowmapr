'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  MessageSquareText,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import { DIAGRAM_TYPES, normalizeType, type DiagramTypeValue } from '@/lib/diagram-types'

interface PromptPanelProps {
  initialPrompt: string
  diagramType: string
  onRegenerate: (prompt: string, diagramType: string) => void
}

const MAX_PROMPT_LENGTH = 2000

export function PromptPanel({
  initialPrompt,
  diagramType: initialType,
  onRegenerate,
}: PromptPanelProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState(initialPrompt)
  const [type, setType] = useState<DiagramTypeValue>(normalizeType(initialType))

  return (
    <div className="absolute bottom-4 left-4 z-10 w-80">
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
        <button
          onClick={() => setOpen(!open)}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <MessageSquareText className="h-4 w-4 text-[var(--color-accent-brand)]" strokeWidth={1.5} />
            Prompt
          </span>
          {open ? (
            <ChevronDown className="h-4 w-4 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
          ) : (
            <ChevronUp className="h-4 w-4 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
          )}
        </button>

        {open && (
          <div className="space-y-4 border-t border-[var(--color-border)] p-4">
            <div className="space-y-2">
              <Label className="text-xs">Diagram type</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {DIAGRAM_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setType(value)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontSize: 11,
                      fontWeight: type === value ? 600 : 400,
                      fontFamily: 'Inter, sans-serif',
                      background: type === value
                        ? 'var(--color-accent-subtle)'
                        : 'transparent',
                      border: `1px solid ${type === value
                        ? 'var(--color-accent-brand)'
                        : 'var(--color-border)'}`,
                      color: type === value
                        ? 'var(--color-accent-brand)'
                        : 'var(--color-text-secondary)',
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={MAX_PROMPT_LENGTH}
              placeholder="Describe your process…"
              rows={4}
              className="resize-none text-sm"
            />
            <div
              style={{
                textAlign: 'right',
                fontSize: 11,
                marginTop: 4,
                color:
                  prompt.length > MAX_PROMPT_LENGTH * 0.95
                    ? '#ef4444'
                    : prompt.length > MAX_PROMPT_LENGTH * 0.8
                      ? '#f97316'
                      : '#52525b',
              }}
            >
              {prompt.length} / {MAX_PROMPT_LENGTH}
            </div>

            <Button
              size="sm"
              className="w-full gap-2"
              disabled={!prompt.trim()}
              onClick={() => onRegenerate(prompt.trim(), type)}
            >
              <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
              Regenerate
            </Button>

            <p className="text-[10px] leading-relaxed text-[var(--color-text-tertiary)]">
              This will create a new diagram with the updated prompt.
              Your current diagram will be preserved.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
