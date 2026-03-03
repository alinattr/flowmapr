'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

const DIAGRAM_TYPES = [
  {
    id: 'bpmn',
    label: 'BPMN',
    description: 'Business process flows',
    icon: '⬡',
    color: '#6366F1',
    examplePrompt: 'Payment checkout process with card validation and fraud check',
  },
  {
    id: 'uml_sequence',
    label: 'UML Sequence',
    description: 'System interactions over time',
    icon: '⇄',
    color: '#22C55E',
    examplePrompt: 'User login flow with JWT token generation and refresh',
  },
  {
    id: 'erd',
    label: 'ERD',
    description: 'Database schema & relations',
    icon: '⊞',
    color: '#3B82F6',
    examplePrompt: 'E-commerce database with Users, Orders, Products and Payments',
  },
  {
    id: 'c4_l1',
    label: 'C4 Architecture',
    description: 'System architecture overview',
    icon: '◫',
    color: '#A78BFA',
    examplePrompt: 'Mobile banking app with Auth, Wallet, and Notification services',
  },
  {
    id: 'flowchart',
    label: 'Flowchart',
    description: 'Decision trees & processes',
    icon: '⌥',
    color: '#F59E0B',
    examplePrompt: 'KYC verification flow with document check and manual review',
  },
  {
    id: 'api_lens',
    label: 'API Lens',
    description: 'API documentation & architecture',
    icon: '</>',
    color: '#EC4899',
    examplePrompt: 'REST API with auth, users, payments and notifications endpoints',
  },
]

interface OnboardingModalProps {
  onComplete: () => void
  userName?: string
}

export function OnboardingModal({ onComplete, userName }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const selectedDiagram = DIAGRAM_TYPES.find(d => d.id === selectedType)

  function handleSelectType(id: string) {
    setSelectedType(id)
    const diagram = DIAGRAM_TYPES.find(d => d.id === id)
    if (diagram) setPrompt(diagram.examplePrompt)
  }

  async function markCompleted() {
    await supabase.auth.updateUser({ data: { onboarding_completed: true } })
  }

  async function handleGenerate() {
    if (!prompt.trim() || !selectedType) return
    setGenerating(true)

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagramType: selectedType, prompt: prompt.trim() }),
      })

      if (res.status === 402) {
        setGenerating(false)
        toast.error("You've used all your free generations. Upgrade to keep going.")
        await markCompleted()
        onComplete()
        return
      }

      if (!res.ok) throw new Error('Generation failed')

      const data = await res.json() as { diagramId: string }
      await markCompleted()

      let destination = `/diagram/${data.diagramId}`
      if (selectedType === 'api_lens') destination = `/api-lens/${data.diagramId}`
      else if (selectedType === 'uml_sequence') destination = `/sequence/${data.diagramId}`

      router.push(destination)
    } catch {
      setGenerating(false)
      toast.error('Something went wrong. Please try again.')
    }
  }

  async function handleSkip() {
    await markCompleted()
    onComplete()
  }

  const firstName = userName?.split(' ')[0] ?? userName

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.85)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
    }}>
      <div style={{
        width: '100%',
        maxWidth: step === 0 ? 560 : 520,
        background: '#111113',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 20,
        overflow: 'hidden',
        animation: 'fadeInScale 0.3s ease',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)',
      }}>
        {/* Progress bar */}
        <div style={{ height: 2, background: 'rgba(255,255,255,0.06)' }}>
          <div style={{
            height: '100%',
            background: 'linear-gradient(90deg, #6366F1, #8B5CF6)',
            width: `${((step + 1) / 3) * 100}%`,
            transition: 'width 0.4s ease',
            boxShadow: '0 0 8px rgba(99,102,241,0.6)',
          }} />
        </div>

        <div style={{ padding: '32px 32px 28px' }}>
          {/* ── STEP 0: Welcome ── */}
          {step === 0 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{
                  width: 56, height: 56,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  borderRadius: 16,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px',
                  fontSize: 26,
                  boxShadow: '0 0 32px rgba(99,102,241,0.4)',
                }}>
                  ✦
                </div>
                <h1 style={{
                  fontSize: 22, fontWeight: 700, color: '#F8FAFC',
                  margin: '0 0 8px', fontFamily: 'Inter, sans-serif',
                }}>
                  Welcome{firstName ? `, ${firstName}` : ''}! 👋
                </h1>
                <p style={{
                  fontSize: 14, color: '#71717A',
                  lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif',
                }}>
                  Flowmapr turns plain text into professional diagrams in seconds.
                  <br />
                  Let&apos;s create your first one — takes less than a minute.
                </p>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8, marginBottom: 28,
              }}>
                {[
                  { icon: '⬡', label: 'BPMN processes' },
                  { icon: '⇄', label: 'UML sequences' },
                  { icon: '⊞', label: 'ERD schemas' },
                  { icon: '◫', label: 'C4 architecture' },
                  { icon: '⌥', label: 'Flowcharts' },
                  { icon: '</>', label: 'API docs' },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <span style={{ fontSize: 13, color: '#A5B4FC' }}>{item.icon}</span>
                    <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setStep(1)}
                style={primaryBtnStyle}
              >
                Let&apos;s create my first diagram →
              </button>

              <button onClick={handleSkip} style={skipBtnStyle}>
                Skip tutorial, go to workspace
              </button>
            </>
          )}

          {/* ── STEP 1: Choose type ── */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={stepLabelStyle}>Step 1 of 2</div>
                <h2 style={stepHeadingStyle}>What would you like to diagram?</h2>
                <p style={stepSubStyle}>Choose a diagram type — you can always change it later.</p>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                gap: 8, marginBottom: 24,
              }}>
                {DIAGRAM_TYPES.map(type => (
                  <button
                    key={type.id}
                    onClick={() => handleSelectType(type.id)}
                    style={{
                      padding: '14px', borderRadius: 12,
                      background: selectedType === type.id ? `${type.color}14` : 'rgba(255,255,255,0.03)',
                      border: selectedType === type.id
                        ? `1.5px solid ${type.color}55`
                        : '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s ease',
                      outline: 'none',
                    }}
                  >
                    <div style={{ fontSize: 18, marginBottom: 6, color: type.color }}>{type.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>
                      {type.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => selectedType && setStep(2)}
                disabled={!selectedType}
                style={selectedType ? primaryBtnStyle : disabledBtnStyle}
              >
                Continue →
              </button>
            </>
          )}

          {/* ── STEP 2: Enter prompt ── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={stepLabelStyle}>Step 2 of 2</div>
                <h2 style={stepHeadingStyle}>
                  Describe your {selectedDiagram?.label} diagram
                </h2>
                <p style={stepSubStyle}>
                  Write what you want in plain English. We pre-filled an example — edit it or write your own.
                </p>
              </div>

              <div style={{
                padding: '9px 13px', marginBottom: 10,
                background: 'rgba(99,102,241,0.06)',
                border: '1px solid rgba(99,102,241,0.15)',
                borderRadius: 8,
                fontSize: 12, color: '#818CF8', fontFamily: 'Inter, sans-serif',
              }}>
                💡 Tip: the more detail you provide, the better the result
              </div>

              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                rows={4}
                placeholder={`Describe your ${selectedDiagram?.label ?? 'diagram'}...`}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 10, color: '#F1F5F9',
                  fontSize: 14, fontFamily: 'Inter, sans-serif',
                  lineHeight: 1.6, resize: 'vertical', outline: 'none',
                  boxSizing: 'border-box', marginBottom: 20,
                  maxHeight: 160, overflowY: 'auto',
                }}
              />

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setStep(1)}
                  style={{
                    padding: '11px 20px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 10, color: '#94A3B8',
                    fontSize: 14, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                    cursor: 'pointer',
                  }}
                >
                  ← Back
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || generating}
                  style={{
                    ...(prompt.trim() && !generating ? primaryBtnStyle : disabledBtnStyle),
                    flex: 1, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', gap: 8,
                  }}
                >
                  {generating ? (
                    <>
                      <span style={{
                        width: 14, height: 14,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                        display: 'inline-block', flexShrink: 0,
                      }} />
                      Generating…
                    </>
                  ) : (
                    '✦ Generate my diagram'
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Shared style objects ──────────────────────────────────────────

const primaryBtnStyle: React.CSSProperties = {
  width: '100%', padding: '12px',
  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
  border: 'none', borderRadius: 10,
  color: 'white', fontSize: 14, fontWeight: 600,
  fontFamily: 'Inter, sans-serif', cursor: 'pointer',
  boxShadow: '0 0 24px rgba(99,102,241,0.3)',
}

const disabledBtnStyle: React.CSSProperties = {
  width: '100%', padding: '12px',
  background: 'rgba(99,102,241,0.25)',
  border: 'none', borderRadius: 10,
  color: 'rgba(255,255,255,0.4)', fontSize: 14, fontWeight: 600,
  fontFamily: 'Inter, sans-serif', cursor: 'not-allowed',
}

const skipBtnStyle: React.CSSProperties = {
  width: '100%', marginTop: 10, padding: '10px',
  background: 'transparent', border: 'none',
  color: '#52525B', fontSize: 13,
  fontFamily: 'Inter, sans-serif', cursor: 'pointer',
}

const stepLabelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 600, color: '#6366F1',
  letterSpacing: '0.08em', textTransform: 'uppercase',
  fontFamily: 'Inter, sans-serif', marginBottom: 6,
}

const stepHeadingStyle: React.CSSProperties = {
  fontSize: 20, fontWeight: 700, color: '#F8FAFC',
  margin: '0 0 6px', fontFamily: 'Inter, sans-serif',
}

const stepSubStyle: React.CSSProperties = {
  fontSize: 13, color: '#71717A',
  margin: 0, fontFamily: 'Inter, sans-serif', lineHeight: 1.5,
}
