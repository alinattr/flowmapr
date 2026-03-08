'use client'

import { useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { Lock, Copy, Check, RotateCcw } from 'lucide-react'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { AppNavbar } from '@/components/shared/AppNavbar'
import { AppSidebar } from '@/components/shared/AppSidebar'

interface ExplainImageShellProps {
  email: string
  fullName: string | null
  plan: string
  generationsRemaining: number
}

type DetailLevel = 'brief' | 'detailed'

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatTime(d: Date): string {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

export function ExplainImageShell({
  email,
  fullName,
  plan,
  generationsRemaining,
}: ExplainImageShellProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const T = {
    panelBorder:       isDark ? 'rgba(255,255,255,0.07)' : '#E5E7EB',
    rightBg:           isDark ? 'rgba(255,255,255,0.02)' : '#F8FAFF',
    titleColor:        isDark ? '#F1F5F9'                : '#111827',
    subtitleColor:     isDark ? '#64748B'                : '#6B7280',
    labelColor:        isDark ? '#94A3B8'                : '#6B7280',
    dropzoneBg:        isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA',
    dropzoneBorder:    isDark ? 'rgba(255,255,255,0.12)' : '#D1D5DB',
    dropzoneHoverBg:   isDark ? 'rgba(99,102,241,0.06)'  : '#EEF2FF',
    dropzoneHoverBorder: isDark ? 'rgba(99,102,241,0.4)' : '#6366F1',
    dropzoneText:      isDark ? '#64748B'                : '#9CA3AF',
    dropzoneSubtext:   isDark ? '#475569'                : '#D1D5DB',
    previewBg:         isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6',
    previewBorder:     isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
    fileNameColor:     isDark ? '#E2E8F0'                : '#374151',
    fileSizeColor:     isDark ? '#64748B'                : '#9CA3AF',
    toggleBg:          isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6',
    toggleBorder:      isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
    toggleActiveColor: isDark ? '#FFFFFF'                : '#FFFFFF',
    toggleInactiveColor: isDark ? '#94A3B8'              : '#6B7280',
    creditsColor:      isDark ? '#64748B'                : '#9CA3AF',
    disabledBg:        isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6',
    disabledColor:     isDark ? '#475569'                : '#9CA3AF',
    emptyTitle:        isDark ? '#E2E8F0'                : '#374151',
    emptyDesc:         isDark ? '#475569'                : '#9CA3AF',
    cardBg:            isDark ? 'rgba(255,255,255,0.03)' : '#FFFFFF',
    cardBorder:        isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
    cardHeaderBg:      isDark ? 'rgba(255,255,255,0.04)' : '#F8F9FA',
    cardHeaderBorder:  isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    cardTitleColor:    isDark ? '#F1F5F9'                : '#111827',
    cardMetaColor:     isDark ? '#52525B'                : '#9CA3AF',
    sectionTitle:      isDark ? '#94A3B8'                : '#6B7280',
    bodyText:          isDark ? '#CBD5E1'                : '#374151',
    divider:           isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    actionBg:          isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
    actionBorder:      isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB',
    actionColor:       isDark ? '#94A3B8'                : '#374151',
    planGateBg:        isDark ? 'rgba(245,158,11,0.08)'  : '#FFFBEB',
    planGateBorder:    isDark ? 'rgba(245,158,11,0.25)'  : '#FDE68A',
    planGateTitle:     isDark ? '#FCD34D'                : '#92400E',
    planGateDesc:      isDark ? '#A16207'                : '#B45309',
    skeletonBg:        isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
  }

  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [detailLevel, setDetailLevel] = useState<DetailLevel>('detailed')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ explanation: string; fileName: string; analyzedAt: Date } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isLocked = plan === 'free' || plan === 'free_trial'
  const canAnalyze = !!file && !loading && !isLocked

  const acceptFile = useCallback((f: File) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowed.includes(f.type)) {
      toast.error('Unsupported file type. Use PNG, JPG, or WEBP.')
      return
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error('File too large. Maximum size is 10MB.')
      return
    }
    setFile(f)
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) acceptFile(dropped)
  }, [acceptFile])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected) acceptFile(selected)
    e.target.value = ''
  }

  const handleRemove = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
  }

  const handleExplain = async () => {
    if (!file || loading) return

    setLoading(true)
    setResult(null)

    const formData = new FormData()
    formData.append('image', file)
    formData.append('detailLevel', detailLevel)

    try {
      const res = await fetch('/api/explain-image', {
        method: 'POST',
        body: formData,
      })

      if (res.status === 402) {
        const data = await res.json()
        if (data.code === 'PLAN_REQUIRED') {
          toast.error('Explain Image requires Basic or Pro plan.')
        } else {
          toast.error("You've reached your generation limit for this month.")
        }
        setLoading(false)
        return
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error ?? 'Failed to analyze image. Please try again.')
        setLoading(false)
        return
      }

      const data = await res.json()
      setResult({
        explanation: data.explanation,
        fileName: file.name,
        analyzedAt: new Date(),
      })
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result.explanation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleExplainAnother = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
  }

  const parseSections = (text: string) => {
    const sections: { title: string; body: string }[] = []
    const titles = ['OVERVIEW', 'KEY COMPONENTS', 'FLOW & PROCESS', 'PURPOSE']
    for (const title of titles) {
      const idx = text.indexOf(title)
      if (idx === -1) continue
      const afterTitle = text.slice(idx + title.length).trimStart()
      const nextIdx = Math.min(
        ...titles.filter(t => t !== title).map(t => {
          const i = text.indexOf(t, idx + title.length)
          return i === -1 ? Infinity : i
        })
      )
      const body = (nextIdx === Infinity ? afterTitle : afterTitle.slice(0, nextIdx - idx - title.length)).trim()
      sections.push({ title, body })
    }
    if (sections.length === 0) {
      sections.push({ title: 'EXPLANATION', body: text.trim() })
    }
    return sections
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      <AppNavbar
        email={email}
        fullName={fullName}
        generationsRemaining={generationsRemaining}
      />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar plan={plan} />

        {/* Main content */}
        <div className="flex flex-1 overflow-hidden">
          {/* ── LEFT PANEL ── */}
          <div style={{
            width: 420,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            borderRight: `1px solid ${T.panelBorder}`,
            overflowY: 'auto',
            padding: '28px 24px',
            gap: 0,
          }}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: 'rgba(99,102,241,0.12)',
                  border: '1px solid rgba(99,102,241,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="2" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                    <path d="M20 4l-2 2M18 2l2 2" stroke="#FCD34D" strokeWidth="1.5"/>
                  </svg>
                </div>
                <div>
                  <h1 style={{ fontSize: 18, fontWeight: 700, color: T.titleColor, fontFamily: 'Inter, sans-serif', margin: 0 }}>
                    Explain Image
                  </h1>
                  <p style={{ fontSize: 12, color: T.subtitleColor, fontFamily: 'Inter, sans-serif', margin: 0, marginTop: 2 }}>
                    Upload any diagram, get plain English explanation
                  </p>
                </div>
              </div>
            </div>

            {/* Plan gate */}
            {isLocked && (
              <div style={{
                padding: '14px 16px', borderRadius: 10, marginBottom: 20,
                background: T.planGateBg, border: `1px solid ${T.planGateBorder}`,
                display: 'flex', alignItems: 'flex-start', gap: 10,
              }}>
                <Lock size={16} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.planGateTitle, fontFamily: 'Inter, sans-serif' }}>
                    Basic or Pro plan required
                  </div>
                  <div style={{ fontSize: 12, color: T.planGateDesc, fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
                    Explain Image consumes 1 generation credit per analysis.{' '}
                    <a href="/settings" style={{ color: '#6366F1', textDecoration: 'underline' }}>Upgrade your plan</a>
                  </div>
                </div>
              </div>
            )}

            {/* Upload zone */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.labelColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                DIAGRAM IMAGE
              </div>

              {!file ? (
                <div
                  onDragOver={e => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  onClick={() => !isLocked && fileInputRef.current?.click()}
                  style={{
                    minHeight: 200,
                    borderRadius: 12,
                    border: `2px dashed ${dragging ? T.dropzoneHoverBorder : T.dropzoneBorder}`,
                    background: dragging ? T.dropzoneHoverBg : T.dropzoneBg,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 8,
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s ease',
                    padding: '24px 16px',
                  }}
                >
                  <div style={{ fontSize: 40, lineHeight: 1, userSelect: 'none' }}>📎</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.dropzoneText, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
                    {dragging ? 'Release to upload' : 'Drop your diagram here'}
                  </div>
                  <div style={{ fontSize: 12, color: T.dropzoneText, fontFamily: 'Inter, sans-serif' }}>
                    or click to browse
                  </div>
                  <div style={{ fontSize: 11, color: T.dropzoneSubtext, fontFamily: 'Inter, sans-serif', marginTop: 4, textAlign: 'center' }}>
                    PNG, JPG, JPEG, WEBP · Max 10MB
                  </div>
                </div>
              ) : (
                <div style={{
                  borderRadius: 12,
                  border: `1px solid ${T.previewBorder}`,
                  background: T.previewBg,
                  overflow: 'hidden',
                }}>
                  {preview && (
                    <div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.dropzoneBg, minHeight: 140 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Diagram preview" style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain', borderRadius: 6 }} />
                    </div>
                  )}
                  <div style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.fileNameColor, fontFamily: 'Inter, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: 11, color: T.fileSizeColor, fontFamily: 'Inter, sans-serif', marginTop: 1 }}>
                        {formatBytes(file.size)}
                      </div>
                    </div>
                    <button
                      onClick={handleRemove}
                      style={{ background: 'none', border: 'none', color: T.fileSizeColor, cursor: 'pointer', fontSize: 13, padding: 4, flexShrink: 0 }}
                    >
                      ✕ Remove
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />
            </div>

            {/* Detail level toggle */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.labelColor, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8, fontFamily: 'Inter, sans-serif' }}>
                DETAIL LEVEL
              </div>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr',
                borderRadius: 8, overflow: 'hidden',
                border: `1px solid ${T.toggleBorder}`,
                background: T.toggleBg,
              }}>
                {(['brief', 'detailed'] as const).map(level => (
                  <button
                    key={level}
                    onClick={() => setDetailLevel(level)}
                    style={{
                      padding: '8px 12px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12, fontWeight: detailLevel === level ? 600 : 400,
                      fontFamily: 'Inter, sans-serif',
                      background: detailLevel === level ? '#4F46E5' : 'transparent',
                      color: detailLevel === level ? T.toggleActiveColor : T.toggleInactiveColor,
                      transition: 'all 0.12s ease',
                    }}
                  >
                    {level === 'brief' ? 'Brief summary' : 'Detailed explanation'}
                  </button>
                ))}
              </div>
            </div>

            {/* Credits + Explain button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={handleExplain}
                disabled={!canAnalyze}
                style={{
                  width: '100%',
                  padding: '11px 16px',
                  borderRadius: 8,
                  border: 'none',
                  cursor: canAnalyze ? 'pointer' : 'not-allowed',
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  background: canAnalyze ? '#4F46E5' : T.disabledBg,
                  color: canAnalyze ? '#FFFFFF' : T.disabledColor,
                  transition: 'background 0.15s ease',
                }}
              >
                {loading ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 1s linear infinite' }}>
                      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                    </svg>
                    Analyzing your diagram…
                  </>
                ) : (
                  <>✦ Explain diagram</>
                )}
              </button>

              <div style={{ fontSize: 11, color: T.creditsColor, fontFamily: 'Inter, sans-serif', textAlign: 'center' }}>
                {isLocked
                  ? 'Upgrade required to use this feature'
                  : `${generationsRemaining} generation${generationsRemaining !== 1 ? 's' : ''} remaining`
                }
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            background: T.rightBg, overflowY: 'auto', padding: 28,
          }}>
            {!result && !loading && (
              /* Empty state */
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: '40px 24px' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 18,
                  background: isDark ? 'rgba(99,102,241,0.08)' : '#EEF2FF',
                  border: `1px solid ${isDark ? 'rgba(99,102,241,0.2)' : '#C7D2FE'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#818CF8' : '#6366F1'} strokeWidth="1.5" strokeLinecap="round">
                    <rect x="3" y="3" width="18" height="18" rx="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: T.emptyTitle, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
                    Your explanation will appear here
                  </div>
                  <div style={{ fontSize: 13, color: T.emptyDesc, fontFamily: 'Inter, sans-serif', lineHeight: 1.6, maxWidth: 360 }}>
                    Works with flowcharts, BPMN, ERD, architecture diagrams, whiteboard photos, and more.
                  </div>
                </div>
              </div>
            )}

            {!result && loading && (
              /* Loading state */
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.titleColor, fontFamily: 'Inter, sans-serif' }}>
                    Reading your diagram…
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[95, 80, 88, 72, 60].map((w, i) => (
                    <div key={i} style={{
                      height: 14, width: `${w}%`, borderRadius: 6,
                      background: T.skeletonBg,
                      animation: 'pulse 1.5s ease infinite',
                      animationDelay: `${i * 0.12}s`,
                    }} />
                  ))}
                </div>
              </div>
            )}

            {result && (
              /* Result card */
              <div style={{
                borderRadius: 12,
                background: T.cardBg,
                border: `1px solid ${T.cardBorder}`,
                overflow: 'hidden',
                maxWidth: 760,
                width: '100%',
              }}>
                {/* Card header */}
                <div style={{
                  padding: '14px 20px',
                  background: T.cardHeaderBg,
                  borderBottom: `1px solid ${T.cardHeaderBorder}`,
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: 'rgba(99,102,241,0.12)',
                    border: '1px solid rgba(99,102,241,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    📋
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.cardTitleColor, fontFamily: 'Inter, sans-serif' }}>
                      Diagram Explanation
                    </div>
                    <div style={{ fontSize: 11, color: T.cardMetaColor, fontFamily: 'Inter, sans-serif', marginTop: 1 }}>
                      {result.fileName} · {formatTime(result.analyzedAt)}
                    </div>
                  </div>
                </div>

                {/* Sections */}
                <div style={{ padding: '20px' }}>
                  {parseSections(result.explanation).map((section, i) => (
                    <div key={i} style={{ marginBottom: i < parseSections(result.explanation).length - 1 ? 20 : 0 }}>
                      <div style={{
                        fontSize: 10, fontWeight: 700, color: T.sectionTitle,
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        fontFamily: 'Inter, sans-serif', marginBottom: 6,
                      }}>
                        {section.title}
                      </div>
                      <div style={{
                        fontSize: 13, color: T.bodyText,
                        lineHeight: 1.75, fontFamily: 'Inter, sans-serif',
                      }}>
                        {section.body}
                      </div>
                      {i < parseSections(result.explanation).length - 1 && (
                        <div style={{ height: 1, background: T.divider, marginTop: 20 }} />
                      )}
                    </div>
                  ))}
                </div>

                {/* Footer actions */}
                <div style={{
                  padding: '14px 20px',
                  borderTop: `1px solid ${T.cardHeaderBorder}`,
                  display: 'flex', gap: 10,
                }}>
                  <button
                    onClick={handleCopy}
                    style={{
                      flex: 1, padding: '9px 14px', borderRadius: 8,
                      border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : T.actionBorder}`,
                      background: copied ? 'rgba(34,197,94,0.08)' : T.actionBg,
                      color: copied ? '#4ADE80' : T.actionColor,
                      fontSize: 12, fontWeight: 500,
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer', transition: 'all 0.15s ease',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    {copied ? <Check size={12} /> : <Copy size={12} />}
                    {copied ? 'Copied!' : 'Copy explanation'}
                  </button>
                  <button
                    onClick={handleExplainAnother}
                    style={{
                      flex: 1, padding: '9px 14px', borderRadius: 8,
                      border: '1px solid rgba(99,102,241,0.25)',
                      background: 'rgba(99,102,241,0.08)',
                      color: '#A5B4FC',
                      fontSize: 12, fontWeight: 500,
                      fontFamily: 'Inter, sans-serif',
                      cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}
                  >
                    <RotateCcw size={12} />
                    Explain another
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.8; }
        }
      `}</style>
    </div>
  )
}
