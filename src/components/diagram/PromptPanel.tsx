'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  MessageSquareText,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react'
import type { DiagramType } from '@/types/diagram'

interface PromptPanelProps {
  initialPrompt: string
  diagramType: string
  onRegenerate: (prompt: string, diagramType: string) => void
}

export function PromptPanel({
  initialPrompt,
  diagramType: initialType,
  onRegenerate,
}: PromptPanelProps) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState(initialPrompt)
  const [type, setType] = useState<DiagramType>(
    initialType as DiagramType
  )

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
              <RadioGroup
                value={type}
                onValueChange={(v) => setType(v as DiagramType)}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="bpmn" id="regen-bpmn" />
                  <Label htmlFor="regen-bpmn" className="cursor-pointer text-xs font-normal">
                    BPMN
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="user_flow" id="regen-uf" />
                  <Label htmlFor="regen-uf" className="cursor-pointer text-xs font-normal">
                    User Flow
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="uml_class" id="regen-uml" />
                  <Label htmlFor="regen-uml" className="cursor-pointer text-xs font-normal">
                    ERD
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe your process…"
              rows={4}
              className="resize-none text-sm"
            />

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
