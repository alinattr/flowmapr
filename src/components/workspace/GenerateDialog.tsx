'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, Sparkles } from 'lucide-react'
import { GenerationLoader } from '@/components/shared/GenerationLoader'
import type { DiagramType } from '@/types/diagram'

interface GenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GenerateDialog({ open, onOpenChange }: GenerateDialogProps) {
  const router = useRouter()
  const [diagramType, setDiagramType] = useState<DiagramType>('bpmn')
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!prompt.trim()) {
      toast.error('Please describe your process')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagramType, prompt: prompt.trim() }),
      })

      if (res.status === 402) {
        setLoading(false)
        onOpenChange(false)
        toast.error(
          "You've used all your free generations. Upgrade to keep going.",
          {
            action: {
              label: 'Upgrade',
              onClick: () => router.push('/settings'),
            },
          }
        )
        return
      }

      if (!res.ok) {
        throw new Error('Generation failed')
      }

      const data = await res.json()
      router.push(`/diagram/${data.diagramId}`)
    } catch {
      setLoading(false)
      toast.error('Something went wrong. Please try again.')
    }
  }

  if (loading) {
    return <GenerationLoader />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate a diagram</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2">
          <div className="space-y-3">
            <Label>Diagram type</Label>
            <RadioGroup
              value={diagramType}
              onValueChange={(v) => setDiagramType(v as DiagramType)}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="bpmn" id="type-bpmn" />
                <Label htmlFor="type-bpmn" className="cursor-pointer font-normal">
                  BPMN
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="user_flow" id="type-uf" />
                <Label htmlFor="type-uf" className="cursor-pointer font-normal">
                  User Flow
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="uml_class" id="type-uml" />
                <Label htmlFor="type-uml" className="cursor-pointer font-normal">
                  ERD
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">Describe your process</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. User submits a loan application, it goes through credit check, then manual review if score is low, then approval or rejection."
              rows={5}
              className="resize-none font-mono text-sm"
            />
          </div>

          <Button
            className="w-full gap-2"
            onClick={handleGenerate}
            disabled={!prompt.trim()}
          >
            <Sparkles className="h-4 w-4" strokeWidth={1.5} />
            Generate
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
