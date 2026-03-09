'use client'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { DIAGRAM_TYPES as APP_DIAGRAM_TYPES, type DiagramTypeValue } from '@/lib/diagram-types'

const ONBOARDING_PROMPTS: Record<DiagramTypeValue, string> = {
  bpmn: 'Online payment process with input validation and bank authorization',
  uml_sequence: 'User login with JWT token generation and API authentication',
  erd: 'Blog platform with users, posts, comments and tags',
  flowchart: 'User registration flow with email verification and OTP',
  c4_l1: 'E-commerce platform with mobile app, API gateway and payment service',
  c4_l2: 'E-commerce platform containers: frontend, backend API, database, cache',
}

interface OnboardingModalProps {
  onComplete: () => void
  userName?: string
}

export function OnboardingModal({ onComplete, userName }: OnboardingModalProps) {
  const [step, setStep] = useState(0)
  const [selectedType, setSelectedType] = useState<DiagramTypeValue | null>(null)
  const [prompt, setPrompt] = useState('')
  const [generating, setGenerating] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const selectedDiagram = useMemo(
    () => APP_DIAGRAM_TYPES.find(d => d.value === selectedType),
    [selectedType]
  )

  function handleSelectType(id: DiagramTypeValue) {
    setSelectedType(id)
    setPrompt(ONBOARDING_PROMPTS[id])
  }

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent('flowmapr:onboarding-step1-visible', { detail: { visible: step === 0 } })
    )
    return () => {
      window.dispatchEvent(
        new CustomEvent('flowmapr:onboarding-step1-visible', { detail: { visible: false } })
      )
    }
  }, [step])

  async function markCompleted() {
    const { data } = await supabase.auth.getUser()
    const user = data.user
    if (!user) {
      console.error('Failed to update onboarding status: user is not authenticated')
      return false
    }

    // First try regular update (existing profile row).
    const updateAttempt = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', user.id)
      .select('id')
      .maybeSingle()

    if (updateAttempt.error) {
      console.error('Failed to update onboarding status:', updateAttempt.error)
    }

    if (!updateAttempt.error && updateAttempt.data?.id) {
      return true
    }

    // Fallback for accounts where profile row was not created yet.
    const upsertAttempt = await supabase
      .from('profiles')
      .upsert(
        {
          id: user.id,
          email: user.email ?? '',
          full_name: (user.user_metadata?.full_name as string | undefined) ?? null,
          onboarding_completed: true,
        },
        { onConflict: 'id' }
      )

    if (upsertAttempt.error) {
      console.error('Failed to upsert onboarding status:', upsertAttempt.error)
      return false
    }

    return true
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

      if (res.status === 403) {
        setGenerating(false)
        toast.error("You've used all your free generations. Upgrade to keep going.")
        return
      }

      if (!res.ok) throw new Error('Generation failed')

      const data = await res.json() as { diagramId: string }
      const updated = await markCompleted()
      if (!updated) {
        setGenerating(false)
        toast.error('Could not save onboarding progress. Please try again.')
        return
      }
      onComplete()

      let destination = `/diagram/${data.diagramId}`
      if (selectedType === 'uml_sequence') destination = `/sequence/${data.diagramId}`

      router.push(destination)
    } catch {
      setGenerating(false)
      toast.error('Something went wrong. Please try again.')
    }
  }

  async function handleSkip() {
    const updated = await markCompleted()
    if (!updated) {
      toast.error('Could not save onboarding progress. Please try again.')
      return
    }
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
                  👋 Welcome to Flowmapr{firstName ? `, ${firstName}` : ''}!
                </h1>
                <p style={{
                  fontSize: 14, color: '#71717A',
                  lineHeight: 1.6, margin: 0, fontFamily: 'Inter, sans-serif',
                }}>
                  Turn your ideas into diagrams in seconds using AI.
                  <br />
                  Let&apos;s create your first diagram — it takes under 60 seconds.
                </p>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8, marginBottom: 28,
              }}>
                {[
                  { icon: '⬡', label: 'BPMN' },
                  { icon: '⇄', label: 'UML Sequence' },
                  { icon: '⊞', label: 'ERD' },
                  { icon: '⌥', label: 'Flowchart' },
                  { icon: '◫', label: 'C4 Model (L1)' },
                  { icon: '◧', label: 'C4 Model (L2)' },
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
                Let&apos;s go →
              </button>

              <button onClick={handleSkip} style={skipBtnStyle}>
                Skip for now
              </button>
            </>
          )}

          {/* ── STEP 1: Choose type ── */}
          {step === 1 && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={stepLabelStyle}>Step 1 of 2</div>
                <h2 style={stepHeadingStyle}>What would you like to create?</h2>
              </div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
                gap: 8, marginBottom: 24,
              }}>
                {APP_DIAGRAM_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => handleSelectType(type.value)}
                    style={{
                      padding: '14px', borderRadius: 12,
                      background: selectedType === type.value ? `${type.color}14` : 'rgba(255,255,255,0.03)',
                      border: selectedType === type.value
                        ? `1.5px solid ${type.color}55`
                        : '1px solid rgba(255,255,255,0.07)',
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s ease',
                      outline: 'none',
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#E2E8F0', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>
                      {type.label}
                    </div>
                    <div style={{ fontSize: 11, color: '#71717A', fontFamily: 'Inter, sans-serif' }}>
                      {type.description}
                    </div>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setStep(0)}
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
                  onClick={() => selectedType && setStep(2)}
                  disabled={!selectedType}
                  style={{ ...(selectedType ? primaryBtnStyle : disabledBtnStyle), flex: 1 }}
                >
                  Next →
                </button>
              </div>
            </>
          )}

          {/* ── STEP 2: Enter prompt ── */}
          {step === 2 && (
            <>
              <div style={{ marginBottom: 16 }}>
                <div style={stepLabelStyle}>Step 2 of 2</div>
                <h2 style={stepHeadingStyle}>Try this example prompt:</h2>
                <p style={stepSubStyle}>
                  ✏️ Feel free to edit it
                </p>
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
                    'Generate my diagram →'
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
