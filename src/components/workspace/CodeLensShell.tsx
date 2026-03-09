'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Copy, Check, ExternalLink, Lock, CheckCircle2, AlertCircle, FolderInput } from 'lucide-react'
import { ReactFlow, Background, Controls, type Node, type Edge } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { AppNavbar } from '@/components/shared/AppNavbar'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { FeatureUpgradeModal } from '@/components/shared/FeatureUpgradeModal'
import { createClient } from '@/lib/supabase/client'
import { getUserProjects } from '@/lib/projects'
import type { Project } from '@/types/diagram'

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
  forceLocked?: boolean
}

// ─── Theme tokens ─────────────────────────────────────────────────────────────
function useClTokens(isDark: boolean) {
  return {
    panelBorder:          isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid #E4E4E7',
    rightPanelBg:         isDark ? 'rgba(0,0,0,0.10)'                : '#FFFFFF',
    titleColor:           isDark ? '#F1F5F9'                         : '#0F0F13',
    subtitleColor:        isDark ? '#52525B'                         : '#52525B',
    // Plan gate
    planGateBg:           isDark ? 'rgba(167,139,250,0.06)'          : 'rgba(91,91,214,0.04)',
    planGateBorder:       isDark ? '1px solid rgba(167,139,250,0.2)' : '1px solid rgba(91,91,214,0.2)',
    planGateTitle:        isDark ? '#C4B5FD'                         : '#5B5BD6',
    planGateDesc:         isDark ? '#71717A'                         : '#52525B',
    planGateIconColor:    isDark ? '#A78BFA'                         : '#5B5BD6',
    // Section labels
    labelColor:           isDark ? '#94A3B8'                         : '#52525B',
    // Language pills
    langInactiveBg:       isDark ? 'rgba(255,255,255,0.04)'          : '#FFFFFF',
    langInactiveColor:    isDark ? '#71717A'                         : '#52525B',
    langInactiveBorder:   isDark ? 'transparent'                     : '#E4E4E7',
    langActiveBg:         isDark ? 'rgba(167,139,250,0.15)'          : '#5B5BD6',
    langActiveColor:      isDark ? '#C4B5FD'                         : '#FFFFFF',
    langActiveBorder:     isDark ? 'rgba(167,139,250,0.4)'           : '#5B5BD6',
    // Textarea
    textareaBg:           isDark ? 'rgba(255,255,255,0.03)'          : '#FFFFFF',
    textareaBorder:       isDark ? 'rgba(255,255,255,0.08)'          : '#E4E4E7',
    textareaColor:        isDark ? '#F1F5F9'                         : '#0F0F13',
    textareaFocusBorder:  isDark ? 'rgba(167,139,250,0.4)'           : '#5B5BD6',
    // Output toggle
    toggleBg:             isDark ? 'rgba(255,255,255,0.04)'          : '#F7F7F8',
    toggleBorder:         isDark ? '1px solid rgba(255,255,255,0.07)': '1px solid #E4E4E7',
    toggleInactiveColor:  isDark ? '#71717A'                         : '#52525B',
    toggleActiveBg:       isDark ? 'rgba(167,139,250,0.15)'          : '#5B5BD6',
    toggleActiveColor:    isDark ? '#C4B5FD'                         : '#FFFFFF',
    // Hint / credits / disabled
    hintColor:            isDark ? '#52525B'                         : '#A1A1AA',
    disabledBg:           isDark ? 'rgba(255,255,255,0.06)'          : '#F7F7F8',
    disabledColor:        isDark ? '#52525B'                         : '#A1A1AA',
    // Empty / loading state
    emptyTitle:           isDark ? '#71717A'                         : '#0F0F13',
    emptyDesc:            isDark ? '#3F3F46'                         : '#52525B',
    loadingTitle:         isDark ? '#94A3B8'                         : '#0F0F13',
    loadingSubtitle:      isDark ? '#52525B'                         : '#52525B',
    // Result cards
    cardBg:               isDark ? 'rgba(255,255,255,0.02)'          : '#FFFFFF',
    cardBorder:           isDark ? '1px solid rgba(255,255,255,0.07)': '1px solid #E4E4E7',
    cardDivider:          isDark ? '1px solid rgba(255,255,255,0.06)': '1px solid #EFEFEF',
    cardHeaderColor:      isDark ? '#94A3B8'                         : '#0F0F13',
    docTextColor:         isDark ? '#CBD5E1'                         : '#0F0F13',
    docLabelColor:        isDark ? '#71717A'                         : '#A1A1AA',
    docSectionTitle:      isDark ? '#6366F1'                         : '#5B5BD6',
    // Action buttons
    actionBg:             isDark ? 'rgba(255,255,255,0.04)'          : '#F7F7F8',
    actionBorder:         isDark ? '1px solid rgba(255,255,255,0.08)': '1px solid #E4E4E7',
    actionColor:          isDark ? '#94A3B8'                         : '#52525B',
    actionHoverBg:        isDark ? 'rgba(255,255,255,0.08)'          : '#F0F0F2',
    actionHoverColor:     isDark ? '#F1F5F9'                         : '#0F0F13',
    // Diagram canvas background
    diagramBg:            isDark ? 'rgba(255,255,255,0.04)'          : '#F7F7F8',
    diagramPlaceholderText: isDark ? '#52525B'                       : '#A1A1AA',
  }
}

export type ClTokens = ReturnType<typeof useClTokens>

export function CodeLensShell({
  email,
  fullName,
  generationsRemaining,
  plan,
  forceLocked = false,
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
  const [isExporting, setIsExporting] = useState(false)
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [savedArtifactId, setSavedArtifactId] = useState<string | null>(null)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)

  const isPlanLocked = forceLocked || plan !== 'pro'

  async function autoSaveArtifact(data: CodeLensResult, lang: Language, mode: 'doc' | 'doc_diagram') {
    setSaveState('saving')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setSaveState('error'); return }

      const { data: defaultProject } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_default', true)
        .single()

      const summary = data.documentation?.summary ?? ''
      const title = summary.length > 60 ? summary.slice(0, 60) + '…' : (summary || 'Code analysis')

      const { data: saved, error } = await supabase
        .from('artifacts')
        .insert({
          user_id: user.id,
          project_id: defaultProject?.id ?? null,
          type: 'code_lens',
          title,
          content: {
            documentation: data.documentation,
            diagramType: data.diagram?.diagramType ?? null,
            language: lang,
            outputMode: mode,
            savedDiagramId: data.savedDiagramId ?? null,
            savedAt: new Date().toISOString(),
          },
          diagram_id: data.savedDiagramId ?? null,
        })
        .select()
        .single()

      if (error || !saved) { setSaveState('error'); return }
      setSavedArtifactId(saved.id)
      setSaveState('saved')
    } catch {
      setSaveState('error')
    }
  }

  async function handleAnalyse() {
    if (!code.trim() || loading) return
    if (isPlanLocked) {
      setUpgradeModalOpen(true)
      return
    }
    setSaveState('idle')
    setSavedArtifactId(null)
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

      if (res.status === 403) {
        const data = await res.json().catch(() => ({}))
        setLoading(false)
        if (data.feature === 'code_lens' || data.error === 'feature_not_available') {
          setUpgradeModalOpen(true)
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
      // Auto-save silently in background (capture current language/outputMode)
      autoSaveArtifact(data, language, outputMode).catch(err => {
        console.error('[code-lens] auto-save failed:', err)
        setSaveState('error')
      })
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

  const handleExportPDF = useCallback(async () => {
    if (!result?.documentation || isExporting) return
    setIsExporting(true)
    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import('jspdf'),
        import('html2canvas'),
      ])
      const doc = result.documentation
      const esc = (s: string) =>
        s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')

      const sections = [
        { title: 'WHAT THIS CODE DOES', content: doc.summary },
        { title: 'WHY IT EXISTS',       content: doc.purpose },
        { title: 'KEY BUSINESS RULES',  content: doc.business_rules?.join('\n') },
        { title: 'INPUTS & OUTPUTS',    content: `In: ${doc.inputs}\n\nOut: ${doc.outputs}` },
        { title: 'EDGE CASES & ERROR HANDLING', content: doc.edge_cases?.join('\n') },
        { title: 'DEPENDENCIES',        content: doc.dependencies?.join(', ') },
      ].filter(s => s.content)

      const container = document.createElement('div')
      container.style.cssText = [
        'position:fixed', 'top:-9999px', 'left:-9999px',
        'width:794px', 'background:#ffffff',
        'font-family:Georgia,serif', 'color:#111827',
        'padding:64px 56px', 'box-sizing:border-box',
      ].join(';')

      const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      container.innerHTML = `
        <div style="border-bottom:2px solid #6366F1;padding-bottom:20px;margin-bottom:36px;">
          <div style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6366F1;margin-bottom:10px;">Code Documentation</div>
          <div style="font-size:22px;font-weight:700;color:#111827;margin-bottom:6px;">${esc(doc.summary?.slice(0, 80) ?? 'Code Analysis')}</div>
          <div style="font-size:12px;color:#6B7280;font-family:Inter,sans-serif;">Generated by Flowmapr · ${dateStr}</div>
        </div>
        ${sections.map(s => `
          <div style="margin-bottom:32px;">
            <div style="font-family:Inter,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6366F1;margin-bottom:12px;">${esc(s.title)}</div>
            <div style="font-size:14px;line-height:1.8;color:#374151;white-space:pre-line;">${esc(s.content!)}</div>
          </div>
        `).join('')}
        <div style="margin-top:56px;padding-top:16px;border-top:1px solid #E5E7EB;font-family:Inter,sans-serif;font-size:11px;color:#9CA3AF;text-align:center;">flowmapr.com</div>
      `
      document.body.appendChild(container)

      const canvas = await html2canvas(container, {
        scale: 2, useCORS: true, backgroundColor: '#ffffff', width: 794, windowWidth: 794,
      })
      document.body.removeChild(container)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = pdf.internal.pageSize.getHeight()
      const scaledHeight = (canvas.height / 2) * (pdfWidth / (canvas.width / 2))

      if (scaledHeight <= pdfHeight) {
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, scaledHeight)
      } else {
        let yOffset = 0
        let remaining = scaledHeight
        while (remaining > 0) {
          pdf.addImage(imgData, 'PNG', 0, -yOffset, pdfWidth, scaledHeight)
          remaining -= pdfHeight
          yOffset += pdfHeight
          if (remaining > 0) pdf.addPage()
        }
      }
      pdf.save('code-documentation.pdf')
    } catch (err) {
      console.error('[exportPDF]', err)
    } finally {
      setIsExporting(false)
    }
  }, [result, isExporting])

  const canAnalyse = code.trim().length > 0 && !loading

  return (
    <div style={{ display: 'flex', height: '100vh', flexDirection: 'column', background: 'var(--color-bg, #09090B)' }}>
      <AppNavbar email={email} fullName={fullName} generationsRemaining={creditsLeft} />
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <AppSidebar plan={plan} generationsRemaining={creditsLeft} />

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
                    Code Lens is available on the Pro plan
                  </span>
                </div>
                <p style={{ fontSize: 12, color: T.planGateDesc, fontFamily: 'Inter, sans-serif', margin: 0, lineHeight: 1.5 }}>
                  Upgrade to analyse code, generate documentation, and visualise code flows.
                </p>
                <button
                  onClick={() => setUpgradeModalOpen(true)}
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
                onExportPDF={handleExportPDF}
                isExporting={isExporting}
                T={T}
                isDark={isDark}
                saveState={saveState}
                savedArtifactId={savedArtifactId}
                onRetrySave={() => result && autoSaveArtifact(result, language, outputMode)}
              />
            ) : (
              <EmptyState loading={loading} T={T} />
            )}
          </div>
        </main>
      </div>
      <FeatureUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        featureName="Code Lens"
        requiredPlan="pro"
      />
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

/* ─── Save status bar ───────────────────────────────────────────────────── */
function SaveStatusBar({
  saveState, onRetrySave, savedArtifactId, isDark,
}: {
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  onRetrySave: () => void
  savedArtifactId: string | null
  isDark: boolean
}) {
  const [showPicker, setShowPicker] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [moving, setMoving] = useState(false)
  const [movedTo, setMovedTo] = useState<string | null>(null)

  async function openPicker() {
    const ps = await getUserProjects()
    setProjects(ps)
    setShowPicker(true)
  }

  async function confirmMove() {
    if (!savedArtifactId || !selectedId) return
    setMoving(true)
    const supabase = createClient()
    await supabase.from('artifacts').update({ project_id: selectedId }).eq('id', savedArtifactId)
    const name = projects.find(p => p.id === selectedId)?.name ?? 'project'
    setMovedTo(name)
    setShowPicker(false)
    setMoving(false)
  }

  if (saveState === 'idle') return null

  const savingBg = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(91,91,214,0.04)'
  const savingBorder = isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(91,91,214,0.15)'
  const savedBg = isDark ? 'rgba(34,197,94,0.08)' : 'rgba(22,163,74,0.06)'
  const savedBorder = isDark ? '1px solid rgba(34,197,94,0.2)' : '1px solid rgba(22,163,74,0.15)'
  const errorBg = isDark ? 'rgba(239,68,68,0.08)' : 'rgba(220,38,38,0.06)'
  const errorBorder = isDark ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(220,38,38,0.15)'

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      {saveState === 'saving' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: savingBg, border: savingBorder, fontSize: 12, color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
          <Loader2 size={13} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
          Saving to your workspace…
        </div>
      )}
      {saveState === 'saved' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: savedBg, border: savedBorder, fontSize: 12, color: '#86EFAC', fontFamily: 'Inter, sans-serif', flexWrap: 'wrap' }}>
          <CheckCircle2 size={13} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{movedTo ? `Saved · ${movedTo}` : 'Saved to My workspace'}</span>
          {!movedTo && (
            <button
              onClick={openPicker}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#86EFAC', fontSize: 12, fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 4, padding: 0, textDecoration: 'underline', textUnderlineOffset: 3, opacity: 0.85 }}
            >
              <FolderInput size={12} />
              Add to a project →
            </button>
          )}
        </div>
      )}
      {saveState === 'error' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8, background: errorBg, border: errorBorder, fontSize: 12, color: '#FCA5A5', fontFamily: 'Inter, sans-serif', flexWrap: 'wrap' }}>
          <AlertCircle size={13} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Not saved yet</span>
          <button
            onClick={onRetrySave}
            style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, cursor: 'pointer', color: '#FCA5A5', fontSize: 11, fontFamily: 'Inter, sans-serif', padding: '3px 10px' }}
          >
            Save to workspace
          </button>
        </div>
      )}

      {/* Project picker popover */}
      {showPicker && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100,
          background: isDark ? '#18181B' : '#FFFFFF',
          border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E4E4E7',
          borderRadius: 10, padding: '10px 0', minWidth: 220,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          fontFamily: 'Inter, sans-serif',
        }}>
          <div style={{ padding: '4px 14px 10px', fontSize: 11, fontWeight: 700, color: isDark ? '#71717A' : '#A1A1AA', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Add to project
          </div>
          {projects.length === 0 && (
            <div style={{ padding: '6px 14px', fontSize: 13, color: isDark ? '#71717A' : '#A1A1AA' }}>No projects yet</div>
          )}
          {projects.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedId(p.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, width: '100%',
                padding: '7px 14px', background: selectedId === p.id ? (isDark ? 'rgba(99,102,241,0.15)' : 'rgba(91,91,214,0.08)') : 'none',
                border: 'none', cursor: 'pointer', textAlign: 'left',
                fontSize: 13, color: isDark ? '#F1F5F9' : '#0F0F13',
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, flexShrink: 0 }} />
              {p.name}
            </button>
          ))}
          <div style={{ display: 'flex', gap: 6, padding: '10px 14px 4px', borderTop: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E4E4E7', marginTop: 4 }}>
            <button onClick={() => setShowPicker(false)} style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid #E4E4E7', background: 'none', cursor: 'pointer', fontSize: 12, color: isDark ? '#71717A' : '#52525B', fontFamily: 'Inter, sans-serif' }}>
              Cancel
            </button>
            <button
              onClick={confirmMove}
              disabled={!selectedId || moving}
              style={{ flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', background: selectedId ? '#6366F1' : 'rgba(99,102,241,0.3)', cursor: selectedId ? 'pointer' : 'not-allowed', fontSize: 12, color: '#fff', fontFamily: 'Inter, sans-serif', fontWeight: 600 }}
            >
              {moving ? '…' : 'Add'}
            </button>
          </div>
        </div>
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
  onExportPDF: () => void
  isExporting: boolean
  T: ClTokens
  isDark: boolean
  saveState: 'idle' | 'saving' | 'saved' | 'error'
  savedArtifactId: string | null
  onRetrySave: () => void
}

function ResultPanel({ result, outputMode, onCopyDoc, copiedDoc, onOpenInEditor, onExportPDF, isExporting, T, isDark, saveState, savedArtifactId, onRetrySave }: ResultPanelProps) {
  const doc = result.documentation

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: 24, gap: 20 }}>
      {/* ── Save status ── */}
      <SaveStatusBar saveState={saveState} onRetrySave={onRetrySave} savedArtifactId={savedArtifactId} isDark={isDark} />

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
          <DocSection title="What this code does" T={T}>
            <p style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>{doc.summary}</p>
          </DocSection>

          <DocSection title="Why it exists" T={T}>
            <p style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>{doc.purpose}</p>
          </DocSection>

          {doc.business_rules.length > 0 && (
            <DocSection title="Key business rules" T={T}>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {doc.business_rules.map((rule, i) => (
                  <li key={i} style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>{rule}</li>
                ))}
              </ul>
            </DocSection>
          )}

          <DocSection title="Inputs & Outputs" T={T}>
            <p style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>
              <span style={{ color: T.docLabelColor }}>In: </span>{doc.inputs}
            </p>
            <p style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: '4px 0 0' }}>
              <span style={{ color: T.docLabelColor }}>Out: </span>{doc.outputs}
            </p>
          </DocSection>

          {doc.edge_cases.length > 0 && (
            <DocSection title="Edge cases & error handling" T={T}>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {doc.edge_cases.map((ec, i) => (
                  <li key={i} style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>{ec}</li>
                ))}
              </ul>
            </DocSection>
          )}

          {doc.dependencies.length > 0 && (
            <DocSection title="Dependencies" T={T}>
              <p style={{ fontSize: 13, color: T.docTextColor, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, margin: 0 }}>{doc.dependencies.join(', ')}</p>
            </DocSection>
          )}
        </div>

        <div style={{ padding: '10px 18px', borderTop: T.cardDivider, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <ActionButton onClick={onCopyDoc} icon={copiedDoc ? <Check size={13} /> : <Copy size={13} />} T={T}>
            {copiedDoc ? 'Copied!' : 'Copy as text'}
          </ActionButton>
          <button
            onClick={onExportPDF}
            disabled={isExporting}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 12px', borderRadius: 7,
              border: '1px solid rgba(99,102,241,0.25)',
              background: 'rgba(99,102,241,0.10)', cursor: isExporting ? 'not-allowed' : 'pointer',
              color: '#A5B4FC', fontSize: 12, fontFamily: 'Inter, sans-serif', fontWeight: 500,
              opacity: isExporting ? 0.7 : 1,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => {
              if (!isExporting) {
                e.currentTarget.style.background = 'rgba(99,102,241,0.18)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
              }
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(99,102,241,0.10)'
              e.currentTarget.style.borderColor = 'rgba(99,102,241,0.25)'
            }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            {isExporting ? 'Exporting…' : 'Export as PDF'}
          </button>
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
function DocSection({ title, children, T }: { title: string; children: React.ReactNode; T: ClTokens }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{
        fontSize: 10, fontWeight: 700, color: T.docSectionTitle,
        fontFamily: 'Inter, sans-serif', textTransform: 'uppercase',
        letterSpacing: '0.12em', marginBottom: 2,
      }}>
        {title}
      </span>
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
