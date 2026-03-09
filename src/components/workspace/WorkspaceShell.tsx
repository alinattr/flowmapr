'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { AppNavbar } from '@/components/shared/AppNavbar'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { GenerateDialog } from '@/components/workspace/GenerateDialog'
import { WorkspaceToolbar, type SortOption, type ViewMode } from '@/components/workspace/WorkspaceToolbar'
import { Sparkles, FileText, MoreHorizontal, Trash2, FolderInput, GitBranch, Pencil } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { moveDiagramToProject, moveArtifactToProject, getUserProjects, renameDiagram, renameArtifact } from '@/lib/projects'
import { useActiveProject } from '@/lib/context/active-project-context'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'
import { useTheme } from '@/lib/theme/ThemeProvider'
import type { DiagramSummary, Project, Artifact } from '@/types/diagram'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function diagramPath(d: { id: string; diagram_type: string }) {
  if (d.diagram_type === 'api_lens') return `/api-lens/${d.id}`
  if (d.diagram_type === 'uml_sequence') return `/sequence/${d.id}`
  return `/diagram/${d.id}`
}

const TYPE_BADGE_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  bpmn:         { bg: 'rgba(99,102,241,0.15)',  color: '#818CF8', label: 'BPMN' },
  uml_sequence: { bg: 'rgba(34,197,94,0.15)',   color: '#4ADE80', label: 'UML Seq' },
  erd:          { bg: 'rgba(59,130,246,0.15)',  color: '#60A5FA', label: 'ERD' },
  flowchart:    { bg: 'rgba(245,158,11,0.15)',  color: '#FCD34D', label: 'Flowchart' },
  c4_l1:        { bg: 'rgba(167,139,250,0.15)', color: '#C4B5FD', label: 'C4 (L1)' },
  c4_l2:        { bg: 'rgba(139,92,246,0.15)',  color: '#A78BFA', label: 'C4 (L2)' },
  api_lens:     { bg: 'rgba(6,182,212,0.15)',   color: '#67E8F9', label: 'API Lens' },
}

function getTypeStyle(type: string) {
  return TYPE_BADGE_STYLES[type] ?? { bg: 'rgba(113,113,122,0.15)', color: '#71717A', label: type ?? 'Unknown' }
}

const TYPE_COLORS: Record<string, string> = {
  bpmn: '#6366F1',
  uml_sequence: '#22C55E',
  erd: '#3B82F6',
  flowchart: '#F59E0B',
  c4_l1: '#A78BFA',
  c4_l2: '#8B5CF6',
  api_lens: '#06B6D4',
}

type Tab = 'all' | 'diagrams' | 'api_lens' | 'code_lens' | 'explain_diagram'

const TABS: { id: Tab; label: string }[] = [
  { id: 'all',             label: 'All' },
  { id: 'diagrams',        label: 'Diagrams' },
  { id: 'api_lens',        label: 'API Lens' },
  { id: 'code_lens',       label: 'Code Lens' },
  { id: 'explain_diagram', label: 'Explain Diagram' },
]

// Diagram types that belong to the "Diagrams" tab (excludes api_lens)
const DIAGRAM_TYPES = new Set(['bpmn', 'uml_sequence', 'erd', 'flowchart', 'c4_l1', 'c4_l2', 'user_flow', 'uml_class', 'c4'])

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface WorkspaceShellProps {
  email: string
  fullName: string | null
  generationsRemaining: number
  plan: string
  diagrams: DiagramSummary[]
  needsOnboarding?: boolean
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function WorkspaceShell({
  email,
  fullName,
  generationsRemaining,
  plan,
  diagrams: initialDiagrams,
  needsOnboarding = false,
}: WorkspaceShellProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [generateOpen, setGenerateOpen] = useState(false)
  const [diagrams, setDiagrams] = useState(initialDiagrams)
  const [projects, setProjects] = useState<Project[]>([])
  const [explainArtifacts, setExplainArtifacts] = useState<Artifact[]>([])
  const [codeLensArtifacts, setCodeLensArtifacts] = useState<Artifact[]>([])
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('updated_desc')
  // Inline rename state (shared for diagrams + artifacts by ID)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('ws-view') as ViewMode) ?? 'grid'
    return 'grid'
  })

  useEffect(() => { localStorage.setItem('ws-view', view) }, [view])

  useEffect(() => {
    if (!needsOnboarding) return
    const t = setTimeout(() => setShowOnboarding(true), 600)
    return () => clearTimeout(t)
  }, [needsOnboarding])

  // Load projects + artifacts
  useEffect(() => {
    getUserProjects().then(setProjects).catch(() => {})
    const supabase = createClient()
    supabase
      .from('artifacts')
      .select('*')
      .eq('type', 'explain_diagram')
      .order('updated_at', { ascending: false })
      .then(({ data }) => { if (data) setExplainArtifacts(data as Artifact[]) })
    supabase
      .from('artifacts')
      .select('*')
      .eq('type', 'code_lens')
      .order('updated_at', { ascending: false })
      .then(({ data }) => { if (data) setCodeLensArtifacts(data as Artifact[]) })
  }, [])

  // Register the default project as active so the [+ New] modal pre-selects "My workspace"
  const { setActiveProject } = useActiveProject()
  useEffect(() => {
    const defaultProject = projects.find(p => p.is_default)
    if (defaultProject) {
      setActiveProject(defaultProject.id, defaultProject.name, true)
    }
    return () => setActiveProject(null, null)
  // setActiveProject is stable (useCallback in provider), projects drives the update
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects])

  // ── Theme tokens ──────────────────────────────────────────────────────────
  const T = {
    tabText:        isDark ? 'rgba(161,161,170,0.8)' : '#6B7280',
    tabActiveText:  isDark ? '#F1F5F9'               : '#111827',
    tabActiveBg:    isDark ? 'rgba(99,102,241,0.12)' : 'rgba(99,102,241,0.10)',
    tabActiveBorder:isDark ? '#6366F1'               : '#6366F1',
    listRowBg:      isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA',
    listRowBorder:  isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    listRowHover:   isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6',
  }

  // ── Data helpers ─────────────────────────────────────────────────────────
  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    const diffMs = Date.now() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('diagrams').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setDiagrams(prev => prev.filter(d => d.id !== id))
    toast.success('Diagram deleted')
  }

  async function handleDeleteArtifact(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('artifacts').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setExplainArtifacts(prev => prev.filter(a => a.id !== id))
    toast.success('Deleted')
  }

  async function handleDeleteCodeLensArtifact(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('artifacts').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setCodeLensArtifacts(prev => prev.filter(a => a.id !== id))
    toast.success('Deleted')
  }

  async function handleMoveToProject(diagramId: string, projectId: string | null) {
    const originalProjectId = diagrams.find(d => d.id === diagramId)?.project_id ?? null
    const ok = await moveDiagramToProject(diagramId, projectId)
    if (!ok) { toast.error('Failed to move'); return }
    setDiagrams(prev => prev.map(d =>
      d.id === diagramId ? { ...d, project_id: projectId } as DiagramSummary : d
    ))
    const pName = projects.find(p => p.id === projectId)?.name ?? 'workspace'
    toast.success(projectId ? `Moved to "${pName}"` : 'Removed from project', {
      action: { label: 'Undo', onClick: () => handleMoveToProject(diagramId, originalProjectId) },
    })
  }

  async function handleMoveArtifactToProject(artifactId: string, projectId: string | null) {
    const originalProjectId = explainArtifacts.find(a => a.id === artifactId)?.project_id ?? null
    const ok = await moveArtifactToProject(artifactId, projectId)
    if (!ok) { toast.error('Failed to move'); return }
    setExplainArtifacts(prev => prev.map(a =>
      a.id === artifactId ? { ...a, project_id: projectId } : a
    ))
    const pName = projects.find(p => p.id === projectId)?.name ?? 'workspace'
    toast.success(projectId ? `Moved to "${pName}"` : 'Removed from project', {
      action: { label: 'Undo', onClick: () => handleMoveArtifactToProject(artifactId, originalProjectId) },
    })
  }

  async function handleMoveCodeLensToProject(artifactId: string, projectId: string | null) {
    const originalProjectId = codeLensArtifacts.find(a => a.id === artifactId)?.project_id ?? null
    const ok = await moveArtifactToProject(artifactId, projectId)
    if (!ok) { toast.error('Failed to move'); return }
    setCodeLensArtifacts(prev => prev.map(a =>
      a.id === artifactId ? { ...a, project_id: projectId } : a
    ))
    const pName = projects.find(p => p.id === projectId)?.name ?? 'workspace'
    toast.success(projectId ? `Moved to "${pName}"` : 'Removed from project', {
      action: { label: 'Undo', onClick: () => handleMoveCodeLensToProject(artifactId, originalProjectId) },
    })
  }

  async function handleConfirmRename(id: string, type: 'diagram' | 'artifact' | 'code_lens') {
    const name = renameValue.trim()
    setRenamingId(null)
    if (!name) return
    if (type === 'diagram') {
      const ok = await renameDiagram(id, name)
      if (!ok) { toast.error('Failed to rename'); return }
      setDiagrams(prev => prev.map(d => d.id === id ? { ...d, title: name } : d))
    } else if (type === 'code_lens') {
      const ok = await renameArtifact(id, name)
      if (!ok) { toast.error('Failed to rename'); return }
      setCodeLensArtifacts(prev => prev.map(a => a.id === id ? { ...a, title: name } : a))
    } else {
      const ok = await renameArtifact(id, name)
      if (!ok) { toast.error('Failed to rename'); return }
      setExplainArtifacts(prev => prev.map(a => a.id === id ? { ...a, title: name } : a))
    }
  }

  // ── Tab filtering ────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let d = [...diagrams]

    if (activeTab === 'diagrams') d = d.filter(x => DIAGRAM_TYPES.has(x.diagram_type))
    else if (activeTab === 'api_lens') d = d.filter(x => x.diagram_type === 'api_lens')
    else if (activeTab === 'code_lens' || activeTab === 'explain_diagram') d = []

    if (search.trim()) {
      const q = search.toLowerCase()
      d = d.filter(x => x.title.toLowerCase().includes(q) || x.diagram_type.toLowerCase().includes(q))
    }

    switch (sort) {
      case 'updated_desc': d.sort((a, b) => b.updated_at.localeCompare(a.updated_at)); break
      case 'updated_asc':  d.sort((a, b) => a.updated_at.localeCompare(b.updated_at)); break
      case 'created_desc': d.sort((a, b) => b.created_at.localeCompare(a.created_at)); break
      case 'name_asc':     d.sort((a, b) => a.title.localeCompare(b.title)); break
    }
    return d
  }, [diagrams, activeTab, search, sort])

  // ── Code Lens artifact filtering ─────────────────────────────────────────
  const filteredCodeLens = useMemo(() => {
    let a = [...codeLensArtifacts]
    if (search.trim()) {
      const q = search.toLowerCase()
      a = a.filter(x => x.title.toLowerCase().includes(q))
    }
    switch (sort) {
      case 'updated_desc': a.sort((a, b) => b.updated_at.localeCompare(a.updated_at)); break
      case 'updated_asc':  a.sort((a, b) => a.updated_at.localeCompare(b.updated_at)); break
      case 'created_desc': a.sort((a, b) => b.created_at.localeCompare(a.created_at)); break
      case 'name_asc':     a.sort((a, b) => a.title.localeCompare(b.title)); break
    }
    return a
  }, [codeLensArtifacts, search, sort])

  // ── Explain Diagram artifact filtering ───────────────────────────────────
  const filteredExplain = useMemo(() => {
    let a = [...explainArtifacts]
    if (search.trim()) {
      const q = search.toLowerCase()
      a = a.filter(x => x.title.toLowerCase().includes(q))
    }
    switch (sort) {
      case 'updated_desc': a.sort((a, b) => b.updated_at.localeCompare(a.updated_at)); break
      case 'updated_asc':  a.sort((a, b) => a.updated_at.localeCompare(b.updated_at)); break
      case 'created_desc': a.sort((a, b) => b.created_at.localeCompare(a.created_at)); break
      case 'name_asc':     a.sort((a, b) => a.title.localeCompare(b.title)); break
    }
    return a
  }, [explainArtifacts, search, sort])

  // ── Cards ────────────────────────────────────────────────────────────────
  function DiagramCard({ d }: { d: DiagramSummary }) {
    const isRenaming = renamingId === d.id
    return (
      <div className="diagram-card group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow hover:shadow-md"
        style={{ overflow: 'hidden' }}>

        {/* Preview — full-width link */}
        <Link href={diagramPath(d)} className="block">
          <div style={{
            height: 160, background: 'var(--color-surface-raised)',
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', borderBottom: '1px solid var(--color-border)',
            borderRadius: '8px 8px 0 0', padding: 12,
          }}>
            {d.preview_svg ? (
              <div
                className="preview-svg-wrap"
                style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                dangerouslySetInnerHTML={{ __html: d.preview_svg }}
              />
            ) : (
              <FileText className="h-8 w-8 text-[var(--color-text-tertiary)]" strokeWidth={1} />
            )}
            <div className="thumbnail-overlay">
              <span className="thumbnail-overlay-label">Open →</span>
            </div>
          </div>
        </Link>

        {/* Info area — outside Link so rename input works */}
        <div style={{ padding: '12px 14px' }}>
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={() => handleConfirmRename(d.id, 'diagram')}
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmRename(d.id, 'diagram')
                if (e.key === 'Escape') setRenamingId(null)
              }}
              style={{
                width: '100%', fontSize: 14, fontWeight: 600,
                fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)',
                background: 'transparent', border: 'none',
                borderBottom: '2px solid #6366F1', outline: 'none', padding: '0 0 2px',
              }}
            />
          ) : (
            <p className="truncate text-[var(--color-text-primary)]" style={{ fontSize: 14, fontWeight: 600 }}>{d.title}</p>
          )}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            {(() => { const s = getTypeStyle(d.diagram_type); return (
              <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif', background: s.bg, color: s.color }}>
                {s.label}
              </span>
            )})()}
            <span style={{ fontSize: 12, color: '#6B7280' }}>{formatDate(d.updated_at)}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-[var(--color-surface-raised)] group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setRenamingId(d.id); setRenameValue(d.title) }}>
              <Pencil className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Rename
            </DropdownMenuItem>
            {projects.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderInput className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Move to project
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleMoveToProject(d.id, null)}>
                    — No project
                  </DropdownMenuItem>
                  {projects.map(p => (
                    <DropdownMenuItem key={p.id} onClick={() => handleMoveToProject(d.id, p.id)}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', marginRight: 8 }} />
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[var(--color-danger)]" onClick={() => handleDelete(d.id)}>
              <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // ── Explain Diagram artifact card ────────────────────────────────────────
  function ExplainArtifactCard({ a }: { a: Artifact }) {
    const isRenaming = renamingId === a.id
    return (
      <div className="diagram-card group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow hover:shadow-md" style={{ overflow: 'hidden' }}>
        {/* Preview — link */}
        <Link href={`/workspace/explain-diagram/${a.id}`} className="block">
          <div style={{
            height: 160, background: 'var(--color-surface-raised)',
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderBottom: '1px solid var(--color-border)', borderRadius: '8px 8px 0 0',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: isDark ? 'rgba(20,184,166,0.1)' : 'rgba(20,184,166,0.08)',
              border: `1px solid ${isDark ? 'rgba(20,184,166,0.25)' : 'rgba(20,184,166,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0D9488" strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </div>
            <div className="thumbnail-overlay"><span className="thumbnail-overlay-label">Open →</span></div>
          </div>
        </Link>

        {/* Info area */}
        <div style={{ padding: '12px 14px' }}>
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={() => handleConfirmRename(a.id, 'artifact')}
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmRename(a.id, 'artifact')
                if (e.key === 'Escape') setRenamingId(null)
              }}
              style={{
                width: '100%', fontSize: 14, fontWeight: 600,
                fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)',
                background: 'transparent', border: 'none',
                borderBottom: '2px solid #14B8A6', outline: 'none', padding: '0 0 2px',
              }}
            />
          ) : (
            <p className="truncate text-[var(--color-text-primary)]" style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</p>
          )}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif', background: 'rgba(20,184,166,0.15)', color: '#0D9488' }}>
              Explain
            </span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{formatDate(a.updated_at)}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-[var(--color-surface-raised)] group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setRenamingId(a.id); setRenameValue(a.title) }}>
              <Pencil className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Rename
            </DropdownMenuItem>
            {projects.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderInput className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Move to project
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleMoveArtifactToProject(a.id, null)}>
                    — No project
                  </DropdownMenuItem>
                  {projects.map(p => (
                    <DropdownMenuItem key={p.id} onClick={() => handleMoveArtifactToProject(a.id, p.id)}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', marginRight: 8 }} />
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[var(--color-danger)]" onClick={() => handleDeleteArtifact(a.id)}>
              <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // ── Code Lens artifact card ──────────────────────────────────────────────
  function CodeLensArtifactCard({ a }: { a: Artifact }) {
    const isRenaming = renamingId === a.id
    return (
      <div className="diagram-card group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow hover:shadow-md" style={{ overflow: 'hidden' }}>
        <Link href={`/workspace/code-lens/${a.id}`} className="block">
          <div style={{
            height: 160, background: 'var(--color-surface-raised)',
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderBottom: '1px solid var(--color-border)', borderRadius: '8px 8px 0 0',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 12,
              background: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.08)',
              border: `1px solid ${isDark ? 'rgba(99,102,241,0.25)' : 'rgba(99,102,241,0.2)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#818CF8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
            </div>
            <div className="thumbnail-overlay"><span className="thumbnail-overlay-label">Open →</span></div>
          </div>
        </Link>

        <div style={{ padding: '12px 14px' }}>
          {isRenaming ? (
            <input
              autoFocus
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onBlur={() => handleConfirmRename(a.id, 'code_lens')}
              onKeyDown={e => {
                if (e.key === 'Enter') handleConfirmRename(a.id, 'code_lens')
                if (e.key === 'Escape') setRenamingId(null)
              }}
              style={{
                width: '100%', fontSize: 14, fontWeight: 600,
                fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)',
                background: 'transparent', border: 'none',
                borderBottom: '2px solid #6366F1', outline: 'none', padding: '0 0 2px',
              }}
            />
          ) : (
            <p className="truncate text-[var(--color-text-primary)]" style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</p>
          )}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif', background: 'rgba(99,102,241,0.15)', color: '#A5B4FC' }}>
              Code Lens
            </span>
            <span style={{ fontSize: 12, color: '#6B7280' }}>{formatDate(a.updated_at)}</span>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-[var(--color-surface-raised)] group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => { setRenamingId(a.id); setRenameValue(a.title) }}>
              <Pencil className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Rename
            </DropdownMenuItem>
            {projects.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <FolderInput className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Move to project
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleMoveCodeLensToProject(a.id, null)}>
                    — No project
                  </DropdownMenuItem>
                  {projects.map(p => (
                    <DropdownMenuItem key={p.id} onClick={() => handleMoveCodeLensToProject(a.id, p.id)}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', marginRight: 8 }} />
                      {p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[var(--color-danger)]" onClick={() => handleDeleteCodeLensArtifact(a.id)}>
              <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // ── Empty state content ──────────────────────────────────────────────────
  function EmptyState() {
    if (search.trim()) return (
      <div className="flex flex-col items-center text-center pt-20" style={{ color: 'var(--color-text-secondary)' }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
        <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif' }}>No results match &ldquo;{search}&rdquo;</p>
        <button onClick={() => setSearch('')} style={{ marginTop: 8, fontSize: 13, color: '#A78BFA', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
          Clear search
        </button>
      </div>
    )
    if (activeTab === 'code_lens') return (
      <div className="flex flex-col items-center text-center pt-20">
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#A78BFA' : '#6366F1'} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 14 }}>
          <polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>
        </svg>
        <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 6 }}>Code Lens</p>
        <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 16 }}>Document your code and auto-generate flow diagrams</p>
        <Link href="/workspace/code-lens" style={{ padding: '8px 18px', borderRadius: 8, background: '#6366F1', color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
          Open Code Lens →
        </Link>
      </div>
    )
    return (
      <div className="flex flex-1 items-center justify-center pt-20">
        <div className="flex max-w-sm flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-subtle)]">
            <GitBranch className="h-8 w-8 text-[var(--color-accent-brand)]" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-[var(--color-text-primary)]">
            {activeTab === 'api_lens' ? 'No API Lens diagrams yet' : activeTab === 'explain_diagram' ? 'No explanations yet' : 'Create your first diagram'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {activeTab === 'api_lens'
              ? 'Generate diagrams from OpenAPI specs using API Lens.'
              : activeTab === 'explain_diagram'
              ? 'Upload any diagram image to get a plain English explanation.'
              : `You have ${generationsRemaining} generations remaining. Describe any process and get a diagram in seconds.`
            }
          </p>
          {activeTab === 'explain_diagram' ? (
            <Link href="/workspace/explain-diagram" className="mt-6" style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#14B8A6,#0D9488)', color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
              Explain a diagram →
            </Link>
          ) : (
            <button className="mt-6" onClick={() => setGenerateOpen(true)} style={{
              padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
              color: 'white', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif',
            }}>
              <Sparkles size={14} strokeWidth={1.5} />
              {activeTab === 'api_lens' ? 'Open API Lens' : 'Generate a diagram'}
            </button>
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      <AppNavbar email={email} fullName={fullName} generationsRemaining={generationsRemaining} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          plan={plan}
          generationsRemaining={generationsRemaining}
          onNewDiagram={() => setGenerateOpen(true)}
        />

        <main className="flex flex-1 flex-col overflow-auto">
          <div className="p-6">
            {/* Header */}
            <div className="mb-5 flex items-center justify-between">
              <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Workspace
              </h1>
              <button
                onClick={() => setGenerateOpen(true)}
                style={{
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: 'white', border: 'none', borderRadius: 10,
                  padding: '9px 16px', fontSize: 13, fontWeight: 600,
                  fontFamily: 'Inter, sans-serif',
                  display: 'flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                <Sparkles size={14} strokeWidth={1.5} />
                New diagram
              </button>
            </div>

            {/* Tab bar */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6'}`, paddingBottom: 0 }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    style={{
                      padding: '7px 14px', border: 'none',
                      borderBottom: isActive ? `2px solid ${T.tabActiveBorder}` : '2px solid transparent',
                      background: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: isActive ? 600 : 400,
                      fontFamily: 'Inter, sans-serif',
                      color: isActive ? T.tabActiveText : T.tabText,
                      transition: 'all 0.12s ease',
                      marginBottom: -1,
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {/* Toolbar */}
            <WorkspaceToolbar
              search={search} sort={sort} view={view}
              onSearch={setSearch} onSort={setSort} onView={setView}
            />

            {/* Content — explain_diagram / code_lens tabs show artifact cards */}
            {activeTab === 'explain_diagram' ? (
              filteredExplain.length === 0 ? (
                <EmptyState />
              ) : view === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredExplain.map(a => <ExplainArtifactCard key={a.id} a={a} />)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredExplain.map(a => (
                    <Link key={a.id} href={`/workspace/explain-diagram/${a.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.listRowBorder}`, background: T.listRowBg, transition: 'background 0.15s', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.background = T.listRowHover }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.listRowBg }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#14B8A6', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                        <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(20,184,166,0.15)', color: '#0D9488', flexShrink: 0 }}>Explain</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{formatDate(a.updated_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : activeTab === 'code_lens' ? (
              filteredCodeLens.length === 0 ? (
                <EmptyState />
              ) : view === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredCodeLens.map(a => <CodeLensArtifactCard key={a.id} a={a} />)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredCodeLens.map(a => (
                    <Link key={a.id} href={`/workspace/code-lens/${a.id}`} style={{ textDecoration: 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.listRowBorder}`, background: T.listRowBg, transition: 'background 0.15s', cursor: 'pointer' }}
                        onMouseEnter={e => { e.currentTarget.style.background = T.listRowHover }}
                        onMouseLeave={e => { e.currentTarget.style.background = T.listRowBg }}
                      >
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
                        <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: 'rgba(99,102,241,0.15)', color: '#A5B4FC', flexShrink: 0 }}>Code Lens</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{formatDate(a.updated_at)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              )
            ) : filtered.length === 0 ? (
              <EmptyState />
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map(d => <DiagramCard key={d.id} d={d} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filtered.map(d => {
                  const dotColor = TYPE_COLORS[d.diagram_type] ?? '#71717A'
                  const badge = getTypeStyle(d.diagram_type)
                  return (
                    <div key={d.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      borderRadius: 8, border: `1px solid ${T.listRowBorder}`,
                      background: T.listRowBg, transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.listRowHover }}
                      onMouseLeave={e => { e.currentTarget.style.background = T.listRowBg }}
                    >
                      <Link href={diagramPath(d)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.title}
                        </span>
                        <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: badge.bg, color: badge.color, flexShrink: 0 }}>
                          {badge.label}
                        </span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{formatDate(d.updated_at)}</span>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4, borderRadius: 4 }}>
                            <MoreHorizontal size={14} strokeWidth={1.5} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {projects.length > 0 && (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger>
                                <FolderInput className="mr-2 h-4 w-4" strokeWidth={1.5} />Move to project
                              </DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleMoveToProject(d.id, null)}>— No project</DropdownMenuItem>
                                {projects.map(p => (
                                  <DropdownMenuItem key={p.id} onClick={() => handleMoveToProject(d.id, p.id)}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', marginRight: 8 }} />
                                    {p.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuSubContent>
                            </DropdownMenuSub>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-[var(--color-danger)]" onClick={() => handleDelete(d.id)}>
                            <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.5} />Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </main>
      </div>

      <GenerateDialog open={generateOpen} onOpenChange={setGenerateOpen} />

      {showOnboarding && (
        <OnboardingModal
          onComplete={() => setShowOnboarding(false)}
          userName={fullName ?? email}
        />
      )}
    </div>
  )
}
