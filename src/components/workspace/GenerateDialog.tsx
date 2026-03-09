'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sparkles } from 'lucide-react'
import { GenerationLoader } from '@/components/shared/GenerationLoader'
import type { DiagramType } from '@/types/diagram'
import { DIAGRAM_TYPES as CANONICAL_TYPES } from '@/lib/diagram-types'
import { useActiveProject } from '@/lib/context/active-project-context'

interface GenerateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const DIAGRAM_TYPES = CANONICAL_TYPES.map(t => ({ ...t, desc: t.description }))

const PLACEHOLDERS: Record<string, string> = {
  bpmn: 'e.g. Online order process: Customer places order, Payment Service validates card, Warehouse picks items, Delivery assigns courier, Customer receives package.',
  uml_sequence: 'e.g. Food delivery app: Customer searches restaurants and selects items. Mobile App sends order to Order Service. Order Service requests payment from Payment Service. Payment confirmed, Restaurant notified. Restaurant prepares order. Delivery Service picks up and delivers to Customer.',
  erd: 'e.g. E-commerce database: Users table with id, email, name, created_at. Orders table with id, user_id (FK), total, status, created_at. Products table with id, name, price, stock, category_id. Order_Items table with id, order_id (FK), product_id (FK), quantity, price. Categories table with id, name, parent_id.',
  flowchart: 'e.g. Password reset flow: User enters email. Check if email exists — if not, show error. Send reset link. User clicks link. Check if link expired — if yes, request new link. User enters new password. Save password. End.',
  c4_l1: 'e.g. Fintech wallet system (Tambadana): Client uses Mobile App to top up wallet via FPX banking, pay QR merchants, transfer funds from credit line, and view transaction history. Mobile App connects to Backend Service which integrates with Fasspay API Wallet and stores data in PostgreSQL.',
  c4_l2: 'e.g. Tambadana wallet containers: Mobile App (React Native) → API Gateway → Auth Service, Wallet Service, Payment Service, Transaction Service. Wallet Service → PostgreSQL. Payment Service → Fasspay API (external). All services → Redis cache.',
}

export function GenerateDialog({ open, onOpenChange }: GenerateDialogProps) {
  const router = useRouter()
  const { activeProjectId } = useActiveProject()
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
        body: JSON.stringify({ diagramType, prompt: prompt.trim(), projectId: activeProjectId }),
      })

      if (res.status === 403) {
        const payload = await res.json().catch(() => ({}))
        setLoading(false)
        onOpenChange(false)
        const message = payload.error === 'feature_not_available'
          ? 'This feature is not available on your current plan.'
          : "You've used all your monthly generations. Upgrade to keep going."
        toast.error(message, {
          action: {
            label: 'Upgrade',
            onClick: () => router.push('/settings'),
          },
        })
        return
      }

      if (!res.ok) {
        throw new Error('Generation failed')
      }

      const data = await res.json()
      let destination = `/diagram/${data.diagramId}`
      if (diagramType === 'uml_sequence') destination = `/sequence/${data.diagramId}`
      router.push(destination)
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
      <DialogContent className="max-w-lg" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <DialogHeader>
          <DialogTitle>Generate a diagram</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 pt-2" style={{ overflow: 'auto', flex: 1 }}>
          <div className="space-y-3">
            <Label>Diagram type</Label>
            <div className="grid grid-cols-2 gap-2">
              {DIAGRAM_TYPES.map(({ value, label, color, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setDiagramType(value as DiagramType)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                    background: diagramType === value ? `${color}15` : 'rgba(255,255,255,0.02)',
                    border: `1.5px solid ${diagramType === value ? color + '60' : 'rgba(255,255,255,0.08)'}`,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: diagramType === value ? color : 'var(--color-text-primary)', fontFamily: 'Inter, sans-serif' }}>
                      {label}
                    </span>
                  </div>
                  <p style={{ marginTop: 3, fontSize: 11, color: 'var(--color-text-tertiary, #71717A)', fontFamily: 'Inter, sans-serif', paddingLeft: 16 }}>
                    {desc}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt">
              Describe your process
            </Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={PLACEHOLDERS[diagramType] ?? 'Describe your process…'}
              rows={5}
              className="font-mono text-sm"
              style={{ maxHeight: 200, overflowY: 'auto', resize: 'vertical' }}
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
