'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Loader2, X, Sparkles, FileCode2 } from 'lucide-react'
import { DiagramTopBar } from './DiagramTopBar'
import { ApiLensShell } from './ApiLensShell'
import { HistoryPanel } from './HistoryPanel'
import { createClient } from '@/lib/supabase/client'
import { saveVersion } from '@/lib/diagram/versions'

interface ApiEndpoint {
  id: string
  method: string
  path: string
  summary: string
  description?: string
  tags?: string[]
  parameters?: Array<{ name: string; in: string; required: boolean; type: string; description?: string }>
  requestBody?: { contentType: string; schema: string } | null
  responses?: Array<{ status: number; description: string; schema?: string | null }>
}

interface ApiService {
  id: string
  name: string
  kind?: string
  technology?: string | null
  endpoints: ApiEndpoint[]
  position: { x: number; y: number }
}

type Connection = { id: string; source: string; target: string; label: string }
const MAX_API_LENS_INPUT_LENGTH = 8000

interface ApiLensEditorProps {
  diagramId: string
  initialTitle: string
  services: ApiService[]
  connections: Connection[]
  generationsRemaining: number
  email: string
  fullName: string | null
  isPublic: boolean
  publicSlug: string | null
  linkedC4?: { l1Id: string | null; l2Id: string | null }
  userPlan?: string
}

export function ApiLensEditor({
  diagramId,
  initialTitle,
  services: initialServices,
  connections: initialConnections,
  generationsRemaining,
  email,
  fullName,
  isPublic,
  publicSlug,
  linkedC4,
  userPlan,
}: ApiLensEditorProps) {
  const [title, setTitle] = useState(initialTitle)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | null>(null)
  const [services, setServices] = useState<ApiService[]>(initialServices)
  const [connections, setConnections] = useState<Connection[]>(initialConnections)

  // History panel state
  const [historyOpen, setHistoryOpen] = useState(false)

  // Edit spec panel state
  const [editOpen, setEditOpen] = useState(false)
  const [specText, setSpecText] = useState('')
  const [analysing, setAnalysing] = useState(false)

  async function handleTitleChange(newTitle: string) {
    setTitle(newTitle)
    setSaveStatus('saving')
    const supabase = createClient()
    await supabase.from('diagrams').update({ title: newTitle }).eq('id', diagramId)
    setSaveStatus('saved')
    setTimeout(() => setSaveStatus(null), 2000)
  }

  async function handleReanalyse() {
    if (!specText.trim()) return
    setAnalysing(true)
    try {
      // Save current diagram state as a version before overwriting
      if (services.length > 0) {
        await saveVersion(
          diagramId,
          { services, connections, diagramType: 'api_lens' },
          `Before edit · ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        )
      }

      const res = await fetch('/api/api-lens/analyse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spec: specText.trim() }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { error?: string }).error ?? 'Analysis failed')
      }

      const parsed = await res.json() as { services: ApiService[]; connections: Connection[] }
      const newServices = parsed.services ?? []
      const newConnections = parsed.connections ?? []

      // Update local state
      setServices(newServices)
      setConnections(newConnections)

      // Persist to Supabase
      const supabase = createClient()
      await supabase
        .from('diagrams')
        .update({
          flow_data: { services: newServices, connections: newConnections },
          prompt: specText.trim(),
        })
        .eq('id', diagramId)

      setSaveStatus('saved')
      setTimeout(() => setSaveStatus(null), 2000)
      setEditOpen(false)
      setSpecText('')
      toast.success('API spec updated and diagram re-generated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to analyse spec')
    } finally {
      setAnalysing(false)
    }
  }

  async function handleRestore(snapshot: Record<string, unknown>) {
    // Save current state as a version before overwriting (so user can undo)
    if (services.length > 0) {
      await saveVersion(
        diagramId,
        { services, connections, diagramType: 'api_lens' },
        `Before restore · ${new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
      )
    }

    const restoredServices = (snapshot.services as ApiService[]) ?? []
    const restoredConnections = (snapshot.connections as Connection[]) ?? []

    setServices(restoredServices)
    setConnections(restoredConnections)

    // Persist restored state to Supabase
    const supabase = createClient()
    await supabase
      .from('diagrams')
      .update({
        flow_data: { services: restoredServices, connections: restoredConnections },
        updated_at: new Date().toISOString(),
      })
      .eq('id', diagramId)

    setSaveStatus('saved')
    setTimeout(() => setSaveStatus(null), 2000)
    toast.success('Version restored')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
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
        diagramType="api_lens"
        nodes={[]}
        edges={[]}
        userPlan={userPlan}
        onHistoryOpen={() => setHistoryOpen(true)}
      />
      <div style={{ flex: 1, overflow: 'hidden' }}>
        <ApiLensShell
          services={services}
          connections={connections}
          diagramTitle={title}
          linkedC4={linkedC4}
          onEditSpec={() => setEditOpen(true)}
          diagramId={diagramId}
        />
      </div>

      {/* History panel */}
      <HistoryPanel
        diagramId={diagramId}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        onRestore={handleRestore}
      />

      {/* Edit Spec slide-over panel */}
      {editOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => !analysing && setEditOpen(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              background: 'rgba(0,0,0,0.45)',
              backdropFilter: 'blur(2px)',
            }}
          />

          {/* Panel */}
          <div style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 50,
            width: 520, maxWidth: '95vw',
            background: 'var(--color-surface, #111113)',
            borderLeft: '1px solid var(--color-border, rgba(255,255,255,0.08))',
            display: 'flex', flexDirection: 'column',
            boxShadow: '-8px 0 32px rgba(0,0,0,0.4)',
          }}>
            {/* Header */}
            <div style={{
              padding: '16px 20px',
              borderBottom: '1px solid var(--color-border, rgba(255,255,255,0.08))',
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <FileCode2 size={16} style={{ color: '#06B6D4', flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)', fontFamily: 'Inter' }}>
                  Edit API Spec
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-text-tertiary, #71717A)', fontFamily: 'Inter', marginTop: 1 }}>
                  Paste a new OpenAPI spec or describe your API — the diagram will re-generate
                </div>
              </div>
              <button
                onClick={() => !analysing && setEditOpen(false)}
                disabled={analysing}
                style={{
                  background: 'none', border: 'none', cursor: analysing ? 'not-allowed' : 'pointer',
                  color: 'var(--color-text-tertiary, #71717A)', padding: 4, borderRadius: 4,
                  opacity: analysing ? 0.4 : 1,
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Textarea */}
            <div style={{ flex: 1, padding: '16px 20px', overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--color-text-tertiary, #71717A)', fontFamily: 'Inter' }}>
                Paste your OpenAPI / Swagger YAML or JSON, or describe your API endpoints in plain text:
              </div>
              <textarea
                value={specText}
                onChange={e => setSpecText(e.target.value)}
                maxLength={MAX_API_LENS_INPUT_LENGTH}
                disabled={analysing}
                placeholder={`Paste your OpenAPI/Swagger spec here, or describe your API endpoints:\n\ne.g. POST /auth/login — authenticate user\nGET /users/me — get current user profile  \nPOST /courses/enroll — enroll in a course\nGET /courses/{id}/progress — get course progress\nDELETE /users/{id} — delete user account`}
                style={{
                  flex: 1,
                  resize: 'none',
                  padding: '12px 14px',
                  borderRadius: 8,
                  border: '1.5px solid var(--color-border, rgba(255,255,255,0.1))',
                  background: 'var(--color-bg-primary, #09090B)',
                  color: 'var(--color-text-primary, #E4E4E7)',
                  fontFamily: 'JetBrains Mono, Fira Code, monospace',
                  fontSize: 12,
                  lineHeight: 1.6,
                  outline: 'none',
                  opacity: analysing ? 0.6 : 1,
                }}
                onFocus={e => { e.currentTarget.style.borderColor = 'rgba(6,182,212,0.5)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--color-border, rgba(255,255,255,0.1))' }}
              />
              <div
                style={{
                  textAlign: 'right',
                  fontSize: 11,
                  marginTop: 4,
                  color:
                    specText.length > MAX_API_LENS_INPUT_LENGTH * 0.95
                      ? '#ef4444'
                      : specText.length > MAX_API_LENS_INPUT_LENGTH * 0.8
                        ? '#f97316'
                        : '#52525b',
                }}
              >
                {specText.length} / {MAX_API_LENS_INPUT_LENGTH}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: '12px 20px 20px',
              borderTop: '1px solid var(--color-border, rgba(255,255,255,0.08))',
              display: 'flex', gap: 8,
            }}>
              <button
                onClick={() => !analysing && setEditOpen(false)}
                disabled={analysing}
                style={{
                  flex: 1, padding: '9px 0', borderRadius: 7,
                  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--color-text-secondary, #A1A1AA)', cursor: analysing ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter', fontSize: 13, fontWeight: 500,
                  opacity: analysing ? 0.4 : 1,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleReanalyse}
                disabled={analysing || !specText.trim()}
                style={{
                  flex: 2, padding: '9px 0', borderRadius: 7,
                  background: specText.trim() && !analysing ? 'rgba(6,182,212,0.15)' : 'rgba(6,182,212,0.06)',
                  border: `1px solid ${specText.trim() && !analysing ? 'rgba(6,182,212,0.5)' : 'rgba(6,182,212,0.2)'}`,
                  color: specText.trim() && !analysing ? '#22D3EE' : '#0891B2',
                  cursor: analysing || !specText.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'Inter', fontSize: 13, fontWeight: 600,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'all 0.15s ease',
                }}
              >
                {analysing ? (
                  <>
                    <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                    Analysing…
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    Re-analyse Spec
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
