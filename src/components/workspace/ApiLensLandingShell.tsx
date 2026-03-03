'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Sparkles } from 'lucide-react'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { AppNavbar } from '@/components/shared/AppNavbar'
import { AppSidebar } from '@/components/shared/AppSidebar'
import type { DiagramSummary, Folder } from '@/types/diagram'

interface ApiLensLandingShellProps {
  email: string
  fullName: string | null
  generationsRemaining: number
  plan: string
  diagrams: DiagramSummary[]
  folders: Folder[]
}

function useAlTokens(isDark: boolean) {
  return {
    panelBorder:         isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
    rightPanelBg:        isDark ? 'rgba(0,0,0,0.15)'                : '#F5F5F7',
    titleColor:          isDark ? '#F1F5F9'                         : '#111827',
    subtitleColor:       isDark ? '#52525B'                         : '#6B7280',
    labelColor:          isDark ? '#94A3B8'                         : '#6B7280',
    textareaBg:          isDark ? 'rgba(255,255,255,0.03)'          : '#F9FAFB',
    textareaBorder:      isDark ? 'rgba(255,255,255,0.08)'          : '#E5E7EB',
    textareaColor:       isDark ? '#F1F5F9'                         : '#111827',
    textareaFocusBorder: isDark ? 'rgba(6,182,212,0.4)'             : '#06B6D4',
    creditsColor:        isDark ? '#52525B'                         : '#6B7280',
    disabledBg:          isDark ? 'rgba(255,255,255,0.06)'          : '#F3F4F6',
    disabledColor:       isDark ? '#52525B'                         : '#9CA3AF',
    tipListColor:        isDark ? '#71717A'                         : '#6B7280',
    emptyTitle:          isDark ? '#71717A'                         : '#374151',
    emptyDesc:           isDark ? '#3F3F46'                         : '#6B7280',
    loadingTitle:        isDark ? '#94A3B8'                         : '#374151',
    loadingSubtitle:     isDark ? '#52525B'                         : '#6B7280',
  }
}

export function ApiLensLandingShell({
  email,
  fullName,
  generationsRemaining,
  plan,
  diagrams,
  folders,
}: ApiLensLandingShellProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const T = useAlTokens(isDark)

  const [spec, setSpec] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    if (!spec.trim()) {
      toast.error('Please paste your OpenAPI spec or describe your API')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagramType: 'api_lens', prompt: spec.trim() }),
      })

      if (res.status === 402) {
        setLoading(false)
        toast.error("Generation limit reached. Upgrade to continue.", {
          action: { label: 'Upgrade', onClick: () => router.push('/settings?tab=billing') },
        })
        return
      }
      if (!res.ok) throw new Error('Generation failed')

      const data = await res.json()
      router.push(`/api-lens/${data.diagramId}`)
    } catch {
      setLoading(false)
      toast.error('Something went wrong. Please try again.')
    }
  }

  const canGenerate = spec.trim().length > 0 && !loading

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: 'var(--color-bg, #09090B)' }}>
      <AppNavbar email={email} fullName={fullName} generationsRemaining={generationsRemaining} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <AppSidebar plan={plan} diagrams={diagrams} folders={folders} />

        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left panel — input */}
          <div style={{
            width: '40%', minWidth: 340, maxWidth: 520,
            display: 'flex', flexDirection: 'column',
            borderRight: T.panelBorder,
            padding: '28px 24px',
            gap: 20,
            overflowY: 'auto',
          }}>
            {/* Header */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.1))',
                  border: '1px solid rgba(6,182,212,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div>
                  <h1 style={{ fontSize: 18, fontWeight: 700, color: T.titleColor, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                    API Lens
                  </h1>
                  <p style={{ fontSize: 12, color: T.subtitleColor, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                    Generate C4 architecture from your API spec
                  </p>
                </div>
              </div>
            </div>

            {/* Spec input */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.labelColor, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                OpenAPI spec or API description
              </label>
              <textarea
                value={spec}
                onChange={e => setSpec(e.target.value)}
                placeholder={`Paste your OpenAPI/Swagger spec here, or describe your API endpoints:\n\ne.g. POST /auth/login — authenticate user\nGET /users/me — get current user profile\nPOST /payment/init — initialize payment\nGET /wallet/balance — get wallet balance\nDELETE /users/{id} — delete user account`}
                style={{
                  width: '100%',
                  minHeight: 360,
                  background: T.textareaBg,
                  border: `1px solid ${T.textareaBorder}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                  color: T.textareaColor,
                  fontSize: 13,
                  fontFamily: 'JetBrains Mono, Fira Code, monospace',
                  lineHeight: 1.6,
                  resize: 'vertical',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s',
                }}
                onFocus={e => { e.currentTarget.style.borderColor = T.textareaFocusBorder }}
                onBlur={e => { e.currentTarget.style.borderColor = T.textareaBorder }}
              />
            </div>

            {/* Generation credits */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: T.creditsColor, fontFamily: 'Inter, sans-serif' }}>
                {generationsRemaining} generation{generationsRemaining !== 1 ? 's' : ''} remaining
              </span>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 20px', borderRadius: 10,
                background: canGenerate
                  ? 'linear-gradient(135deg, #06B6D4, #0891B2)'
                  : T.disabledBg,
                border: 'none',
                cursor: canGenerate ? 'pointer' : 'not-allowed',
                color: canGenerate ? '#fff' : T.disabledColor,
                fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s ease',
                boxShadow: canGenerate ? '0 0 20px rgba(6,182,212,0.25)' : 'none',
              }}
            >
              {loading ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analysing API…</>
              ) : (
                <><Sparkles size={16} /> Generate diagram</>
              )}
            </button>

            {/* Tips */}
            <div style={{
              background: 'rgba(6,182,212,0.05)',
              border: '1px solid rgba(6,182,212,0.12)',
              borderRadius: 10, padding: '12px 14px',
            }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#06B6D4', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
                What you can paste
              </p>
              <ul style={{ margin: 0, paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                  'OpenAPI 3.x or Swagger 2.x YAML/JSON',
                  'Plain-text list of endpoints',
                  'A short description of your API services',
                  'Postman collection exports',
                ].map(tip => (
                  <li key={tip} style={{ fontSize: 11, color: T.tipListColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right panel — empty / loading state */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 40, gap: 16,
            background: T.rightPanelBg,
          }}>
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: '50%',
                  background: 'rgba(6,182,212,0.1)',
                  border: '2px solid rgba(6,182,212,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: 'pulse 2s ease-in-out infinite',
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#06B6D4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <p style={{ fontSize: 14, color: T.loadingTitle, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
                  Analysing your API spec…
                </p>
                <p style={{ fontSize: 12, color: T.loadingSubtitle, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
                  This usually takes 5–10 seconds
                </p>
              </div>
            ) : (
              <>
                <div style={{
                  width: 64, height: 64, borderRadius: 16,
                  background: 'rgba(6,182,212,0.08)',
                  border: '1px solid rgba(6,182,212,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(6,182,212,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                  </svg>
                </div>
                <div style={{ textAlign: 'center', maxWidth: 360 }}>
                  <p style={{ fontSize: 15, fontWeight: 600, color: T.emptyTitle, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
                    Your diagram will appear here
                  </p>
                  <p style={{ fontSize: 13, color: T.emptyDesc, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                    Paste your OpenAPI spec or describe your API on the left, then click Generate.
                  </p>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
