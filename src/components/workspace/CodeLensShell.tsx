'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Copy, Check, ExternalLink, Lock } from 'lucide-react'
import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { AppNavbar } from '@/components/shared/AppNavbar'
import { AppSidebar } from '@/components/shared/AppSidebar'
import type { DiagramSummary, Folder } from '@/types/diagram'

const SUPPORTED_LANGUAGES = ['Auto-detect', 'TypeScript', 'JavaScript', 'Python', 'SQL', 'Go'] as const
type Language = typeof SUPPORTED_LANGUAGES[number]

interface DocData {
  summary: string
  purpose: string
  business_rules: string[]
  inputs: string
  outputs: string
  edge_cases: string[]
  dependencies: string[]
  diagram_type: string
  diagram_prompt: string
}

interface CodeLensResult {
  documentation: DocData
  diagram?: { nodes: Node[]; edges: Edge[]; diagramType: string }
  savedDiagramId?: string
}

interface CodeLensShellProps {
  email: string
  fullName: string | null
  generationsRemaining: number
  plan: string
  diagrams: DiagramSummary[]
  folders: Folder[]
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────
function useClTokens(isDark: boolean) {
  return {
    panelBorder:          isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.07)',
    rightPanelBg:         isDark ? 'rgba(0,0,0,0.10)'                : '#F5F5F7',
    titleColor:           isDark ? '#F1F5F9'                         : '#111827',
    subtitleColor:        isDark ? '#52525B'                         : '#6B7280',
    // Plan gate
    planGateBg:           isDark ? 'rgba(167,139,250,0.06)'          : '#F0F0FF',
    planGateBorder:       isDark ? '1px solid rgba(167,139,250,0.2)' : '1px solid #C7D2FE',
    planGateTitle:        isDark ? '#C4B5FD'                         : '#4338CA',
    planGateDesc:         isDark ? '#71717A'                         : '#4B5563',
    planGateIconColor:    isDark ? '#A78BFA'                         : '#6366F1',
    // Section labels
    labelColor:           isDark ? '#94A3B8'                         : '#6B7280',
    // Language pills
    langInactiveBg:       isDark ? 'rgba(255,255,255,0.04)'          : '#F3F4F6',
    langInactiveColor:    isDark ? '#71717A'                         : '#374151',
    langInactiveBorder:   isDark ? 'transparent'                     : '#E5E7EB',
    langActiveBg:         isDark ? 'rgba(167,139,250,0.15)'          : '#EDE9FE',
    langActiveColor:      isDark ? '#C4B5FD'                         : '#4F46E5',
    langActiveBorder:     isDark ? 'rgba(167,139,250,0.4)'           : '#C4B5FD',
    // Textarea
    textareaBg:           isDark ? 'rgba(255,255,255,0.03)'          : '#F9FAFB',
    textareaBorder:       isDark ? 'rgba(255,255,255,0.08)'          : '#E5E7EB',
    textareaColor:        isDark ? '#F1F5F9'                         : '#111827',
    textareaFocusBorder:  isDark ? 'rgba(167,139,250,0.4)'           : '#A78BFA',
    // Output toggle
    toggleBg:             isDark ? 'rgba(255,255,255,0.04)'          : '#F3F4F6',
    toggleBorder:         isDark ? '1px solid rgba(255,255,255,0.07)': '1px solid #E5E7EB',
    toggleInactiveColor:  isDark ? '#71717A'                         : '#6B7280',
    toggleActiveBg:       isDark ? 'rgba(167,139,250,0.15)'          : '#4F46E5',
    toggleActiveColor:    isDark ? '#C4B5FD'                         : '#FFFFFF',
    // Hint / credits / disabled
    hintColor:            isDark ? '#52525B'                         : '#6B7280',
    disabledBg:           isDark ? 'rgba(255,255,255,0.06)'          : '#F3F4F6',
    disabledColor:        isDark ? '#52525B'                         : '#9CA3AF',
    // Empty / loading state
    emptyTitle:           isDark ? '#71717A'                         : '#374151',
    emptyDesc:            isDark ? '#3F3F46'                         : '#6B7280',
    loadingTitle:         isDark ? '#94A3B8'                         : '#374151',
    loadingSubtitle:      isDark ? '#52525B'                         : '#6B7280',
    // Result cards
    cardBg:               isDark ? 'rgba(255,255,255,0.02)'          : '#FFFFFF',
    cardBorder:           isDark ? '1px solid rgba(255,255,255,0.07)': '1px solid #E5E7EB',
    cardDivider:          isDark ? '1px solid rgba(255,255,255,0.06)': '1px solid #EAECF0',
    cardHeaderColor:      isDark ? '#94A3B8'                         : '#374151',
    docTextColor:         isDark ? '#CBD5E1'                         : '#374151',
    docLabelColor:        isDark ? '#71717A'                         : '#9CA3AF',
    docSectionTitle:      isDark ? '#71717A'                         : '#6B7280',
    // Action buttons
    actionBg:             isDark ? 'rgba(255,255,255,0.04)'          : '#F9FAFB',
    actionBorder:         isDark ? '1px solid rgba(255,255,255,0.08)': '1px solid #E5E7EB',
    actionColor:          isDark ? '#94A3B8'                         : '#374151',
    actionHoverBg:        isDark ? 'rgba(255,255,255,0.08)'          : '#F3F4F6',
    actionHoverColor:     isDark ? '#F1F5F9'                         : '#111827',
    // Diagram canvas background
    diagramBg:            isDark ? 'rgba(255,255,255,0.04)'          : 'rgba(0,0,0,0.03)',
    diagramPlaceholderText: isDark ? '#52525B'                       : '#9CA3AF',
  }
}

export type ClTokens = ReturnType<typeof useClTokens>

export function CodeLensShell({
  email,
  fullName,
  generationsRemaining,
  plan,
  diagrams,
  folders,
}: CodeLensShellProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const T = useClTokens(isDark)

  const [code, setCode] = useState('')
  const [language, setLanguage] = useState<Language>('Auto-detect')
  const [outputMode, setOutputMode] = useState<'doc' | 'doc_diagram'>('doc_diagram')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CodeLensResult | null>(null)
  const [copiedDoc, setCopiedDoc] = useState(false)
  const [creditsLeft, setCreditsLeft] = useState(generationsRemaining)

  const isPlanLocked = plan === 'free' || plan === 'free_trial'

  async function handleAnalyse() {
    if (!code.trim() || loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/code-lens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          language: language === 'Auto-detect' ? 'auto' : language,
          includeDiagram: outputMode === 'doc_diagram',
        }),
      })

      if (res.status === 402) {
        const data = await res.json().catch(() => ({}))
        setLoading(false)
        if (data.code === 'PLAN_REQUIRED') {
          toast.error('Code Lens requires Basic or Pro plan.', {
            action: { label: 'Upgrade', onClick: () => router.push('/settings?tab=billing') },
          })
        } else {
          toast.error('Generation limit reached. Upgrade to continue.', {
            action: { label: 'Upgrade', onClick: () => router.push('/settings?tab=billing') },
          })
        }
        return
      }
      if (!res.ok) throw new Error('Analysis failed')

      const data = await res.json()
      setResult(data)
      setCreditsLeft(c => Math.max(0, c - 1))
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyDoc = useCallback(async () => {
    if (!result?.documentation) return
    const doc = result.documentation
    const text = [
      `What this code does\n${doc.summary}`,
      `\nWhy it exists\n${doc.purpose}`,
      `\nKey business rules\n${doc.business_rules.map(r => `• ${r}`).join('\n')}`,
      `\nInputs & Outputs\nIn:  ${doc.inputs}\nOut: ${doc.outputs}`,
      doc.edge_cases.length ? `\nEdge cases\n${doc.edge_cases.map(e => `• ${e}`).join('\n')}` : '',
      doc.dependencies.length ? `\nDependencies\n${doc.dependencies.join(', ')}` : '',
    ].filter(Boolean).join('\n')
    await navigator.clipboard.writeText(text)
    setCopiedDoc(true)
    setTimeout(() => setCopiedDoc(false), 2000)
  }, [result])

  const handleOpenInEditor = useCallback(() => {
    if (result?.savedDiagramId) {
      router.push(`/diagram/${result.savedDiagramId}`)
    }
  }, [result, router])

  const canAnalyse = code.trim().length > 0 && !loading && !isPlanLocked

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: 'var(--color-bg, #09090B)' }}>
      <AppNavbar email={email} fullName={fullName} generationsRemaining={creditsLeft} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <AppSidebar plan={plan} diagrams={diagrams} folders={folders} />

        <main style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* ── LEFT PANEL ── */}
          <div style={{
            width: '40%', minWidth: 340, maxWidth: 520,
            display: 'flex', flexDirection: 'column',
            borderRight: T.panelBorder,
            padding: '24px 20px',
            gap: 18,
            overflowY: 'auto',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 8,
                background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.1))',
                border: '1px solid rgba(167,139,250,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#A78BFA" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
              </div>
              <div>
                <h1 style={{ fontSize: 18, fontWeight: 700, color: T.titleColor, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                  Code Lens
                </h1>
                <p style={{ fontSize: 12, color: T.subtitleColor, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                  Turn code into documentation & diagrams
                </p>
              </div>
            </div>

            {/* Plan gate */}
            {isPlanLocked && (
              <div style={{
                background: T.planGateBg,
                border: T.planGateBorder,
                borderRadius: 12, padding: '16px 18px',
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Lock size={14} color={T.planGateIconColor} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.planGateTitle, fontFamily: 'Inter, sans-serif' }}>
                    Code Lens is available on Basic and Pro plans
                  </span>
                </div>
                <p style={{ fontSize: 12, color: T.planGateDesc, fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.5 }}>
                  Upgrade to analyse code, generate documentation, and visualise code flows.
                </p>
                <button
                  onClick={() => router.push('/settings?tab=billing')}
                  style={{
                    padding: '8px 16px', borderRadius: 8,
                    background: 'linear-gradient(135deg, rgba(167,139,250,0.3), rgba(139,92,246,0.2))',
                    border: '1px solid rgba(167,139,250,0.4)',
                    color: '#C4B5FD', fontSize: 13, fontWeight: 600,
                    fontFamily: 'Inter, sans-serif', cursor: 'pointer',
                    alignSelf: 'flex-start',
                  }}
                >
                  Upgrade plan
                </button>
              </div>
            )}

            {/* Language selector */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.labelColor, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Language
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SUPPORTED_LANGUAGES.map(lang => {
                  const isActive = language === lang
                  return (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      style={{
                        padding: '4px 10px', borderRadius: 6, cursor: 'pointer',
                        fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500,
                        background: isActive ? T.langActiveBg : T.langInactiveBg,
                        color: isActive ? T.langActiveColor : T.langInactiveColor,
                        border: `1px solid ${isActive ? T.langActiveBorder : T.langInactiveBorder}`,
                        transition: 'all 0.12s ease',
                      }}
                    >
                      {lang}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Code textarea */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.labelColor, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Code
              </label>
              <textarea
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={`Paste your code here...\n\nExamples:\n• A function with business logic\n• An API route handler\n• A database query\n• A security middleware`}
                style={{
                  width: '100%',
                  minHeight: 260,
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

            {/* Output type toggle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: T.labelColor, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Output
              </label>
              <div style={{ display: 'flex', gap: 0, background: T.toggleBg, borderRadius: 8, padding: 3, border: T.toggleBorder }}>
                {([
                  { key: 'doc', label: 'Documentation only' },
                  { key: 'doc_diagram', label: 'Documentation + Diagram' },
                ] as const).map(opt => {
                  const isActive = outputMode === opt.key
                  return (
                    <button
                      key={opt.key}
                      onClick={() => setOutputMode(opt.key)}
                      style={{
                        flex: 1, padding: '6px 10px', borderRadius: 6, border: 'none', cursor: 'pointer',
                        fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500,
                        background: isActive ? T.toggleActiveBg : 'transparent',
                        color: isActive ? T.toggleActiveColor : T.toggleInactiveColor,
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {opt.label}
                    </button>
                  )
                })}
              </div>
              {outputMode === 'doc_diagram' && (
                <p style={{ fontSize: 11, color: T.hintColor, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                  Diagram shows the code flow visually
                </p>
              )}
            </div>

            {/* Credits */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: T.hintColor, fontFamily: 'Inter, sans-serif' }}>
                {creditsLeft} generation{creditsLeft !== 1 ? 's' : ''} remaining
              </span>
            </div>

            {/* Analyse button */}
            <button
              onClick={handleAnalyse}
              disabled={!canAnalyse}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '11px 20px', borderRadius: 10,
                background: canAnalyse
                  ? 'linear-gradient(135deg, #8B5CF6, #6366F1)'
                  : T.disabledBg,
                border: 'none',
                cursor: canAnalyse ? 'pointer' : 'not-allowed',
                color: canAnalyse ? '#fff' : T.disabledColor,
                fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                transition: 'all 0.2s ease',
                boxShadow: canAnalyse ? '0 0 20px rgba(139,92,246,0.25)' : 'none',
              }}
            >
              {loading ? (
                <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                  Analyse code
                </>
              )}
            </button>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto', background: T.rightPanelBg }}>
            {result ? (
              <ResultPanel
                result={result}
                outputMode={outputMode}
                onCopyDoc={handleCopyDoc}
                copiedDoc={copiedDoc}
                onOpenInEditor={handleOpenInEditor}
                T={T}
              />
            ) : (
              <EmptyState loading={loading} T={T} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

/* ─── Empty / loading state ─────────────────────────────────────────────── */
function EmptyState({ loading, T }: { loading: boolean; T: ClTokens }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 16, height: '100%' }}>
      {loading ? (
        <>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(167,139,250,0.1)',
            border: '2px solid rgba(167,139,250,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Loader2 size={24} color="#A78BFA" style={{ animation: 'spin 1s linear infinite' }} />
          </div>
          <p style={{ fontSize: 14, color: T.loadingTitle, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
            Analysing your code…
          </p>
          <p style={{ fontSize: 12, color: T.loadingSubtitle, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
            This usually takes 10–20 seconds
          </p>
        </>
      ) : (
        <>
          <div style={{
            width: 64, height: 64, borderRadius: 16,
            background: 'rgba(167,139,250,0.08)',
            border: '1px solid rgba(167,139,250,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6"/>
              <polyline points="8 6 2 12 8 18"/>
            </svg>
          </div>
          <div style={{ textAlign: 'center', maxWidth: 360 }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: T.emptyTitle, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
              Documentation & diagram will appear here
            </p>
            <p style={{ fontSize: 13, color: T.emptyDesc, fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
              Paste your code on the left and click Analyse. Works with functions, API routes, queries, and more.
            </p>
          </div>
        </>
      )}
    </div>
  )
}

/* ─── Result panel ──────────────────────────────────────────────────────── */
interface ResultPanelProps {
  result: CodeLensResult
  outputMode: 'doc' | 'doc_diagram'
  onCopyDoc: () => void
  copiedDoc: boolean
  onOpenInEditor: () => void
  T: ClTokens
}

function ResultPanel({ result, outputMode, onCopyDoc, copiedDoc, onOpenInEditor, T }: ResultPanelProps) {
  const doc = result.documentation

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 24, gap: 20 }}>
      {/* ── Documentation card ── */}
      <div style={{
        background: T.cardBg,
        border: T.cardBorder,
        borderRadius: 14, overflow: 'hidden',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '12px 18px',
          borderBottom: T.cardDivider,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: T.cardHeaderColor, fontFamily: 'Inter, sans-serif' }}>
            Documentation
          </span>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <DocSection icon="📄" title="What this code does" T={T}>
            <p style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>{doc.summary}</p>
          </DocSection>

          <DocSection icon="💡" title="Why it exists" T={T}>
            <p style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>{doc.purpose}</p>
          </DocSection>

          {doc.business_rules.length > 0 && (
            <DocSection icon="📋" title="Key business rules" T={T}>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {doc.business_rules.map((rule, i) => (
                  <li key={i} style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>{rule}</li>
                ))}
              </ul>
            </DocSection>
          )}

          <DocSection icon="⚡" title="Inputs & Outputs" T={T}>
            <p style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>
              <span style={{ color: T.docLabelColor }}>In: </span>{doc.inputs}
            </p>
            <p style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: '4px 0 0' }}>
              <span style={{ color: T.docLabelColor }}>Out: </span>{doc.outputs}
            </p>
          </DocSection>

          {doc.edge_cases.length > 0 && (
            <DocSection icon="⚠️" title="Edge cases & error handling" T={T}>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {doc.edge_cases.map((ec, i) => (
                  <li key={i} style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>{ec}</li>
                ))}
              </ul>
            </DocSection>
          )}

          {doc.dependencies.length > 0 && (
            <DocSection icon="🔗" title="Dependencies" T={T}>
              <p style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>{doc.dependencies.join(', ')}</p>
            </DocSection>
          )}
        </div>

        <div style={{ padding: '10px 18px', borderTop: T.cardDivider, display: 'flex', gap: 8 }}>
          <ActionButton onClick={onCopyDoc} icon={copiedDoc ? <Check size={13} /> : <Copy size={13} />} T={T}>
            {copiedDoc ? 'Copied!' : 'Copy as text'}
          </ActionButton>
        </div>
      </div>

      {/* ── Diagram section ── */}
      {outputMode === 'doc_diagram' && (
        <div style={{
          flex: 1, minHeight: 300,
          background: T.cardBg,
          border: T.cardBorder,
          borderRadius: 14, overflow: 'hidden',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{
            padding: '12px 18px',
            borderBottom: T.cardDivider,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: T.cardHeaderColor, fontFamily: 'Inter, sans-serif' }}>
              Diagram
            </span>
            {result.diagram?.diagramType && (
              <span style={{
                fontSize: 10, fontWeight: 600,
                color: '#A78BFA', background: 'rgba(167,139,250,0.1)',
                border: '1px solid rgba(167,139,250,0.2)',
                padding: '2px 7px', borderRadius: 6,
                textTransform: 'uppercase', letterSpacing: '0.05em',
                fontFamily: 'Inter, sans-serif',
              }}>
                {result.diagram.diagramType === 'uml_sequence' ? 'UML Seq' : 'Flowchart'}
              </span>
            )}
          </div>

          <div style={{ flex: 1, position: 'relative' }}>
            {result.diagram?.nodes ? (
              <ReactFlow
                nodes={result.diagram.nodes}
                edges={result.diagram.edges}
                fitView
                fitViewOptions={{ padding: 0.15 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={true}
                zoomOnScroll={true}
                style={{ background: 'transparent' }}
              >
                <Background color={T.diagramBg} gap={20} />
                <Controls showInteractive={false} style={{ background: T.cardBg, border: T.cardBorder, borderRadius: 8 }} />
              </ReactFlow>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 10, padding: 20 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'rgba(167,139,250,0.08)',
                  border: '1px solid rgba(167,139,250,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16 18 22 12 16 6"/>
                    <polyline points="8 6 2 12 8 18"/>
                  </svg>
                </div>
                <p style={{ fontSize: 13, color: T.diagramPlaceholderText, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
                  Diagram will appear here after analysis
                </p>
              </div>
            )}
          </div>

          <div style={{ padding: '10px 18px', borderTop: T.cardDivider, display: 'flex', gap: 8 }}>
            {result.savedDiagramId && (
              <ActionButton onClick={onOpenInEditor} icon={<ExternalLink size={13} />} T={T}>
                Open in editor
              </ActionButton>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

/* ─── Sub-components ────────────────────────────────────────────────────── */
function DocSection({ icon, title, children, T }: { icon: string; title: string; children: React.ReactNode; T: ClTokens }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13 }}>{icon}</span>
        <span style={{ fontSize: 12, fontWeight: 600, color: T.docSectionTitle, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function ActionButton({ onClick, icon, children, T }: { onClick: () => void; icon: React.ReactNode; children: React.ReactNode; T: ClTokens }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        padding: '6px 12px', borderRadius: 7,
        border: T.actionBorder,
        background: T.actionBg, cursor: 'pointer',
        color: T.actionColor, fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500,
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = T.actionHoverBg; e.currentTarget.style.color = T.actionHoverColor }}
      onMouseLeave={e => { e.currentTarget.style.background = T.actionBg; e.currentTarget.style.color = T.actionColor }}
    >
      {icon}
      {children}
    </button>
  )
}
