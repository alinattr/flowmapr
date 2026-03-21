'use client'

import { useState, useCallback, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { DiagramTopBar } from '../DiagramTopBar'
import { SequenceRenderer, type SequenceData, type SeqParticipant, type SeqMessage } from './SequenceRenderer'
import { HistoryPanel } from '@/components/diagram/HistoryPanel'
import { FeedbackBar } from '@/components/diagram/FeedbackBar'
import { GenerationLoader } from '@/components/shared/GenerationLoader'
import { FeatureUpgradeModal } from '@/components/shared/FeatureUpgradeModal'
import { createClient } from '@/lib/supabase/client'
import { saveVersion } from '@/lib/diagram/versions'
import { generateSequencePreview } from '@/lib/diagram/generatePreviewSvg'
import { toast } from 'sonner'
import { Copy, Check, AlertCircle, Eye, Columns, Code2, MessageSquareText, ChevronDown, ChevronUp, Sparkles, Wand2 } from 'lucide-react'

/* ── PlantUML generator ────────────────────────────────────────── */

function toPlantUML(data: SequenceData): string {
  const lines: string[] = ['@startuml']
  lines.push('')

  for (const p of data.participants) {
    const keyword =
      p.type === 'actor' ? 'actor' :
      p.type === 'database' ? 'database' :
      p.type === 'boundary' ? 'boundary' : 'participant'
    const alias = p.label.replace(/^:/, '').replace(/\s+/g, '_')
    lines.push(`${keyword} "${p.label}" as ${alias}`)
  }
  lines.push('')

  const sorted = [...data.messages].sort((a, b) => a.y - b.y)

  const openFrags = new Set<string>()
  const closedFrags = new Set<string>()

  for (const msg of sorted) {
    // Open fragments whose range starts at or before this message
    if (data.fragments) {
      for (const f of data.fragments) {
        if (!openFrags.has(f.id) && msg.y >= f.yStart && msg.y <= f.yEnd) {
          openFrags.add(f.id)
          lines.push(`${f.type} ${f.condition}`)
        }
      }
    }

    const fromP = data.participants.find(p => p.id === msg.from)
    const toP = data.participants.find(p => p.id === msg.to)
    if (!fromP || !toP) continue

    const fromAlias = fromP.label.replace(/^:/, '').replace(/\s+/g, '_')
    const toAlias = toP.label.replace(/^:/, '').replace(/\s+/g, '_')

    const arrow =
      msg.type === 'return' ? '-->>' :
      msg.type === 'async' ? '->>' : '->'

    lines.push(`${fromAlias} ${arrow} ${toAlias}: ${msg.label}`)

    // Close fragments that end at or before this message's y
    if (data.fragments) {
      for (const f of data.fragments) {
        if (openFrags.has(f.id) && !closedFrags.has(f.id)) {
          const nextMsg = sorted.find(m => m.y > msg.y)
          if (!nextMsg || nextMsg.y > f.yEnd) {
            if (f.elseCondition) lines.push(`else ${f.elseCondition}`)
            lines.push('end')
            closedFrags.add(f.id)
          }
        }
      }
    }
  }

  // Close any remaining open fragments
  if (data.fragments) {
    for (const f of data.fragments) {
      if (openFrags.has(f.id) && !closedFrags.has(f.id)) {
        if (f.elseCondition) lines.push(`else ${f.elseCondition}`)
        lines.push('end')
      }
    }
  }

  lines.push('')
  lines.push('@enduml')
  return lines.join('\n')
}

/* ── PlantUML parser ───────────────────────────────────────────── */

function fromPlantUML(text: string): SequenceData | null {
  const participants: SeqParticipant[] = []
  const messages: SeqMessage[] = []
  const aliasToId = new Map<string, string>()

  let title = ''
  let msgY = 160
  let pX = 60
  let pCount = 0
  let mCount = 0

  const lines = text.split('\n').map(l => l.trim())

  for (const line of lines) {
    if (!line || line === '@startuml' || line === '@enduml') continue

    const titleMatch = line.match(/^title\s+(.+)/i)
    if (titleMatch) { title = titleMatch[1]; continue }

    const pMatch = line.match(/^(participant|actor|database|boundary|entity)\s+"([^"]+)"\s+as\s+(\w+)/i)
    if (pMatch) {
      const typeStr = pMatch[1].toLowerCase()
      const pType: SeqParticipant['type'] =
        typeStr === 'actor' ? 'actor' :
        typeStr === 'database' ? 'database' :
        typeStr === 'boundary' ? 'boundary' : 'object'
      const id = `p${++pCount}`
      aliasToId.set(pMatch[3], id)
      participants.push({ id, label: pMatch[2], type: pType, x: pX })
      pX += 180
      continue
    }

    // Simple participant without alias: `participant Foo`
    const pSimple = line.match(/^(participant|actor|database|boundary|entity)\s+(\w+)$/i)
    if (pSimple) {
      const typeStr = pSimple[1].toLowerCase()
      const pType: SeqParticipant['type'] =
        typeStr === 'actor' ? 'actor' :
        typeStr === 'database' ? 'database' :
        typeStr === 'boundary' ? 'boundary' : 'object'
      const id = `p${++pCount}`
      const alias = pSimple[2]
      aliasToId.set(alias, id)
      participants.push({ id, label: alias, type: pType, x: pX })
      pX += 180
      continue
    }

    // Message: `Foo ->> Bar: label` or `Foo --> Bar: label`
    const msgMatch = line.match(/^(\w+)\s+(-+>+>?)\s+(\w+)\s*:\s*(.+)/)
    if (msgMatch) {
      const fromAlias = msgMatch[1]
      const arrow = msgMatch[2]
      const toAlias = msgMatch[3]
      const label = msgMatch[4]

      // Auto-create participants if not declared
      if (!aliasToId.has(fromAlias)) {
        const id = `p${++pCount}`
        aliasToId.set(fromAlias, id)
        participants.push({ id, label: fromAlias, type: 'object', x: pX })
        pX += 180
      }
      if (!aliasToId.has(toAlias)) {
        const id = `p${++pCount}`
        aliasToId.set(toAlias, id)
        participants.push({ id, label: toAlias, type: 'object', x: pX })
        pX += 180
      }

      const isReturn = arrow.includes('--')
      const isAsync = !isReturn && arrow.includes('>>')

      messages.push({
        id: `m${++mCount}`,
        from: aliasToId.get(fromAlias)!,
        to: aliasToId.get(toAlias)!,
        label,
        type: isReturn ? 'return' : isAsync ? 'async' : 'sync',
        y: msgY,
      })
      msgY += 60
    }
  }

  if (participants.length === 0 && messages.length === 0) return null
  return { title, participants, messages }
}

/* ── Editor component ──────────────────────────────────────────── */

interface SequenceEditorProps {
  diagramId: string
  initialTitle: string
  sequenceData: SequenceData
  initialPrompt: string
  generationsRemaining: number
  email: string
  fullName: string | null
  isPublic: boolean
  publicSlug: string | null
  userPlan?: string
  userId?: string
}

type ViewMode = 'visual' | 'split' | 'code'
const MAX_PROMPT_LENGTH = 2000

export function SequenceEditor({
  diagramId,
  initialTitle,
  sequenceData: initialData,
  initialPrompt,
  generationsRemaining,
  email,
  fullName,
  isPublic,
  publicSlug,
  userPlan,
  userId = '',
}: SequenceEditorProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | null>(null)
  const [data, setData] = useState<SequenceData>(initialData)
  const [codeText, setCodeText] = useState(() => toPlantUML(initialData))
  const [codeError, setCodeError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ViewMode>('visual')
  const [copied, setCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [promptOpen, setPromptOpen] = useState(false)
  const [promptText, setPromptText] = useState(initialPrompt)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const supabase = useMemo(() => createClient(), [])

  async function handleTitleChange(newTitle: string) {
    setTitle(newTitle)
    setSaveStatus('saving')
    await supabase.from('diagrams').update({ title: newTitle }).eq('id', diagramId)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus(null), 2000)
  }

  const persistData = useCallback(async (d: SequenceData) => {
    setSaveStatus('saving')
    const preview_svg = generateSequencePreview(d)
    await supabase
      .from('diagrams')
      .update({
        flow_data: d as unknown as Record<string, unknown>,
        preview_svg: preview_svg || null,
      })
      .eq('id', diagramId)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus(null), 2000)
  }, [supabase, diagramId])

  const handleVisualEdit = useCallback((updated: SequenceData) => {
    setData(updated)
    if (viewMode === 'split') setCodeText(toPlantUML(updated))
    persistData(updated)
  }, [persistData, viewMode])

  const handleCodeChange = useCallback((text: string) => {
    setCodeText(text)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      const parsed = fromPlantUML(text)
      if (!parsed) {
        setCodeError('Could not parse PlantUML — check syntax')
        return
      }
      setCodeError(null)
      setData(parsed)
      persistData(parsed)
    }, 500)
  }, [persistData])

  useEffect(() => {
    if (viewMode === 'code' || viewMode === 'split') {
      setCodeText(toPlantUML(data))
      setCodeError(null)
    }
  }, [viewMode]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleCopy() {
    navigator.clipboard.writeText(codeText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleRegenerate() {
    if (!promptText.trim()) return
    // 1. Save current state as "Before regeneration" version FIRST
    await saveVersion(
      diagramId,
      { ...data, title } as Record<string, unknown>,
      `Before regeneration · ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
    )
    setRegenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagramType: 'uml_sequence',
          prompt: promptText.trim(),
          existingDiagramId: diagramId, // update in-place — keeps version history on same diagram
        }),
      })

      if (res.status === 403) {
        const payload = await res.json().catch(() => ({}))
        if (payload?.feature === 'update_diagram_ai') {
          setUpgradeModalOpen(true)
        } else {
          toast.error("You've used all your monthly generations. Upgrade to keep going.", {
            action: { label: 'Upgrade', onClick: () => router.push('/settings') },
          })
        }
        setRegenerating(false)
        return
      }

      if (!res.ok) throw new Error('Generation failed')

      const result = await res.json()
      // 2. Apply new sequence data in-place — no navigation, no lost history
      const fd = result.flowData as Record<string, unknown>
      const newData: SequenceData = {
        title: (fd.title as string) ?? title,
        participants: Array.isArray(fd.participants)
          ? (fd.participants as SequenceData['participants'])
          : data.participants,
        messages: Array.isArray(fd.messages)
          ? (fd.messages as SequenceData['messages'])
          : data.messages,
        fragments: Array.isArray(fd.fragments)
          ? (fd.fragments as SequenceData['fragments'])
          : [],
      }
      setData(newData)
      setCodeText(toPlantUML(newData))
      setRegenerating(false)
      toast.success('Sequence diagram regenerated')
    } catch {
      toast.error('Something went wrong. Please try again.')
      setRegenerating(false)
    }
  }

  async function handleUpdate() {
    if (!promptText.trim()) return
    if ((userPlan ?? 'free') === 'free') {
      setUpgradeModalOpen(true)
      return
    }
    setRegenerating(true)
    try {
      await saveVersion(
        diagramId,
        { ...data, title } as Record<string, unknown>,
        `Before update · ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      )
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          diagramType: 'uml_sequence',
          prompt: promptText.trim(),
          existingDiagramId: diagramId,
          existingDiagram: data,
          updateMode: true,
        }),
      })
      if (res.status === 403) {
        const payload = await res.json().catch(() => ({}))
        if (payload?.feature === 'update_diagram_ai') {
          setUpgradeModalOpen(true)
        } else {
          toast.error("You've used all your monthly generations.", {
            action: { label: 'Upgrade', onClick: () => router.push('/settings') },
          })
        }
        return
      }
      const result = await res.json()
      if (result.flowData) {
        const parsed = result.flowData as SequenceData
        const merged = { ...parsed, title }
        setData(merged)
        setCodeText(toPlantUML(merged))
        await persistData(merged)
        toast.success('Diagram updated')
      }
    } catch {
      toast.error('Update failed. Please try again.')
    } finally {
      setRegenerating(false)
    }
  }

  async function handleRestoreVersion(snapshot: Record<string, unknown>) {
    // Save current state before overwriting
    await saveVersion(diagramId, { ...data, title } as Record<string, unknown>, 'Before restore')

    const restored: SequenceData = {
      title: (snapshot.title as string) ?? title,
      participants: Array.isArray(snapshot.participants)
        ? (snapshot.participants as SequenceData['participants'])
        : data.participants,
      messages: Array.isArray(snapshot.messages)
        ? (snapshot.messages as SequenceData['messages'])
        : data.messages,
      fragments: Array.isArray(snapshot.fragments)
        ? (snapshot.fragments as SequenceData['fragments'])
        : data.fragments,
    }

    setData(restored)
    setCodeText(toPlantUML(restored))

    await supabase
      .from('diagrams')
      .update({ flow_data: restored })
      .eq('id', diagramId)

    toast.success('Version restored')
  }

  if (regenerating) return <GenerationLoader />

  const tabStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
    borderRadius: 6, border: 'none', transition: 'all 0.15s',
    background: active ? 'var(--color-accent-subtle, rgba(99,102,241,0.15))' : 'transparent',
    color: active ? 'var(--color-accent-brand, #818CF8)' : 'var(--color-text-secondary, #94A3B8)',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <DiagramTopBar
        diagramId={diagramId}
        title={title}
        onTitleChange={handleTitleChange}
        saveStatus={saveStatus}
        generationsRemaining={generationsRemaining}
        email={email}
        fullName={fullName}
        isPublic={isPublic}
        publicSlug={publicSlug}
        diagramType="uml_sequence"
        nodes={[]}
        edges={[]}
        userPlan={userPlan}
        onHistoryOpen={() => setHistoryOpen(true)}
      />
      <HistoryPanel
        diagramId={diagramId}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestore={handleRestoreVersion}
      />
      {/* Tabs */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '6px 16px',
        borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.06))',
        background: 'var(--color-surface, #111)',
      }}>
        <button style={tabStyle(viewMode === 'visual')} onClick={() => setViewMode('visual')}>
          <Eye size={14} /> Visual
        </button>
        <button style={tabStyle(viewMode === 'split')} onClick={() => setViewMode('split')}>
          <Columns size={14} /> Split
        </button>
        <button style={tabStyle(viewMode === 'code')} onClick={() => setViewMode('code')}>
          <Code2 size={14} /> Code
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Visual pane */}
        {(viewMode === 'visual' || viewMode === 'split') && (
          <div style={{
            flex: viewMode === 'split' ? 1 : undefined,
            width: viewMode === 'visual' ? '100%' : undefined,
            overflow: 'auto', padding: 32,
            background: 'var(--color-bg-primary, #0D0D10)',
            position: 'relative',
          }}>
            <SequenceRenderer data={data} onEdit={handleVisualEdit} />
          </div>
        )}

        {/* Prompt panel — bottom-left overlay */}
        {(viewMode === 'visual' || viewMode === 'split') && (
          <div style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 10, width: 320,
          }}>
            <div style={{
              overflow: 'hidden', borderRadius: 12,
              border: '1px solid var(--color-border, rgba(255,255,255,0.06))',
              background: 'var(--color-surface, #18181B)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
            }}>
              <button
                onClick={() => setPromptOpen(!promptOpen)}
                style={{
                  display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 14px', fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer',
                  background: 'transparent', color: 'var(--color-text-primary, #E2E8F0)',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--color-surface-raised, rgba(255,255,255,0.04))' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageSquareText size={15} style={{ color: 'var(--color-accent-brand, #818CF8)' }} />
                  Prompt
                </span>
                {promptOpen
                  ? <ChevronDown size={15} style={{ color: 'var(--color-text-secondary)' }} />
                  : <ChevronUp size={15} style={{ color: 'var(--color-text-secondary)' }} />
                }
              </button>

              {promptOpen && (
                <div style={{
                  borderTop: '1px solid var(--color-border, rgba(255,255,255,0.06))',
                  padding: 14, display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  <textarea
                    value={promptText}
                    onChange={e => setPromptText(e.target.value)}
                    maxLength={MAX_PROMPT_LENGTH}
                    placeholder="Describe the interaction you want to diagram…"
                    rows={4}
                    style={{
                      width: '100%', resize: 'none', padding: 10, borderRadius: 8,
                      fontSize: 13, lineHeight: 1.5,
                      background: 'var(--color-bg-primary, #0D0D10)',
                      color: 'var(--color-text-primary, #E2E8F0)',
                      border: '1px solid var(--color-border, rgba(255,255,255,0.08))',
                      outline: 'none', fontFamily: 'Inter, sans-serif',
                    }}
                  />
                  <div
                    style={{
                      textAlign: 'right',
                      fontSize: 11,
                      marginTop: 4,
                      color:
                        promptText.length > MAX_PROMPT_LENGTH * 0.95
                          ? '#ef4444'
                          : promptText.length > MAX_PROMPT_LENGTH * 0.8
                            ? '#f97316'
                            : '#52525b',
                    }}
                  >
                    {promptText.length} / {MAX_PROMPT_LENGTH}
                  </div>

                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      title="Create a new diagram from scratch using this prompt"
                      onClick={handleRegenerate}
                      disabled={!promptText.trim() || regenerating}
                      style={{
                        flex: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '8px 0', fontSize: 13, fontWeight: 600,
                        borderRadius: 8, border: 'none', cursor: promptText.trim() && !regenerating ? 'pointer' : 'not-allowed',
                        background: promptText.trim() && !regenerating
                          ? 'linear-gradient(135deg, #6366F1, #818CF8)'
                          : 'var(--color-surface-raised, #27272A)',
                        color: promptText.trim() && !regenerating ? '#fff' : 'var(--color-text-disabled, #52525B)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Sparkles size={14} />
                      Regenerate
                    </button>
                    <button
                      type="button"
                      title="Update the existing diagram based on your instruction"
                      onClick={handleUpdate}
                      disabled={!promptText.trim() || regenerating}
                      style={{
                        flex: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        padding: '8px 0', fontSize: 13, fontWeight: 600,
                        borderRadius: 8, border: 'none', cursor: promptText.trim() && !regenerating ? 'pointer' : 'not-allowed',
                        background: promptText.trim() && !regenerating
                          ? 'linear-gradient(135deg, #6366F1, #818CF8)'
                          : 'var(--color-surface-raised, #27272A)',
                        color: promptText.trim() && !regenerating ? '#fff' : 'var(--color-text-disabled, #52525B)',
                        transition: 'all 0.15s',
                      }}
                    >
                      <Wand2 size={14} />
                      Update
                    </button>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      fontSize: 10,
                      color: '#52525b',
                      marginTop: 4,
                    }}
                  >
                    <span style={{ flex: 1, textAlign: 'center' }}>
                      Creates new diagram from scratch
                    </span>
                    <span style={{ flex: 1, textAlign: 'center' }}>
                      Adds to existing diagram
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Code pane */}
        {(viewMode === 'code' || viewMode === 'split') && (
          <div style={{
            flex: viewMode === 'split' ? 1 : undefined,
            width: viewMode === 'code' ? '100%' : undefined,
            display: 'flex', flexDirection: 'column',
            borderLeft: viewMode === 'split' ? '1px solid var(--color-border, rgba(255,255,255,0.06))' : 'none',
            background: 'var(--color-surface, #111)',
          }}>
            {/* Code toolbar */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '8px 12px',
              borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.06))',
            }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-secondary)', letterSpacing: 0.5, textTransform: 'uppercase' }}>
                PlantUML
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {codeError && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#F87171' }}>
                    <AlertCircle size={12} /> {codeError}
                  </span>
                )}
                <button
                  onClick={handleCopy}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '4px 10px', fontSize: 11, fontWeight: 500,
                    borderRadius: 4, border: '1px solid var(--color-border)',
                    background: 'transparent', cursor: 'pointer',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            {/* Compatibility note */}
            <div style={{
              padding: '6px 12px',
              fontSize: 10, color: 'var(--color-text-secondary, #64748B)',
              borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.04))',
            }}>
              Compatible with PlantUML, IntelliJ, VS Code PlantUML plugin
            </div>

            <textarea
              value={codeText}
              onChange={e => handleCodeChange(e.target.value)}
              spellCheck={false}
              style={{
                flex: 1, resize: 'none', padding: 16,
                fontFamily: 'JetBrains Mono, Fira Code, monospace',
                fontSize: 12, lineHeight: 1.6, tabSize: 2,
                background: 'transparent',
                color: 'var(--color-text-primary, #E2E8F0)',
                border: 'none', outline: 'none',
                borderLeft: codeError ? '3px solid #F87171' : '3px solid transparent',
              }}
            />
          </div>
        )}
      </div>

      {/* Feedback bar — low visual weight, bottom-left */}
      {userId && (
        <div style={{
          height: 36, display: 'flex', alignItems: 'center',
          padding: '0 16px',
          borderTop: '1px solid var(--color-border, rgba(255,255,255,0.04))',
          background: 'var(--color-surface, #111)',
          flexShrink: 0,
        }}>
          <FeedbackBar
            key={diagramId}
            diagramId={diagramId}
            diagramType="uml_sequence"
            userId={userId}
          />
        </div>
      )}
      <FeatureUpgradeModal
        open={upgradeModalOpen}
        onOpenChange={setUpgradeModalOpen}
        featureName="Update Diagram with AI"
        requiredPlan="basic"
      />
    </div>
  )
}
