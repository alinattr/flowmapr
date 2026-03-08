'use client'

/*
 * Differences merged from WorkspaceShell (formerly /workspace page):
 *  - Added tabs: code_lens, explain_diagram (was only all/diagrams/api_lens)
 *  - Load explain_diagram + code_lens artifacts from `artifacts` table, filtered by project.id
 *  - Added ExplainArtifactCard and CodeLensArtifactCard components
 *  - Added handlers: handleDeleteArtifact, handleDeleteCodeLensArtifact,
 *    handleMoveArtifactToProject, handleMoveCodeLensToProject, handleConfirmRename
 *  - Added filteredExplain + filteredCodeLens memos
 *  - Updated render to branch per artifact type tab
 *  - Kept project header (color dot, inline rename) exactly as-is
 *  - No "New diagram" button — creation is via sidebar [+ New] only
 */

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { AppNavbar } from '@/components/shared/AppNavbar'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { GenerateDialog } from '@/components/workspace/GenerateDialog'
import { WorkspaceToolbar, type SortOption, type ViewMode } from '@/components/workspace/WorkspaceToolbar'
import { FileText, MoreHorizontal, Trash2, Sparkles, GitBranch, Pencil, Check, X, FolderInput } from 'lucide-react'
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
import {
  renameProject, getUserProjects,
  moveDiagramToProject, renameDiagram,
  moveArtifactToProject, renameArtifact,
} from '@/lib/projects'
import { useActiveProject } from '@/lib/context/active-project-context'
import { toast } from 'sonner'
import { useTheme } from '@/lib/theme/ThemeProvider'
import type { DiagramSummary, Project as ProjectType, Artifact } from '@/types/diagram'

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
  bpmn: '#6366F1', uml_sequence: '#22C55E', erd: '#3B82F6',
  flowchart: '#F59E0B', c4_l1: '#A78BFA', c4_l2: '#8B5CF6', api_lens: '#06B6D4',
}

type Tab = 'all' | 'diagrams' | 'api_lens' | 'code_lens' | 'explain_diagram'
const TABS: { id: Tab; label: string }[] = [
  { id: 'all',             label: 'All' },
  { id: 'diagrams',        label: 'Diagrams' },
  { id: 'api_lens',        label: 'API Lens' },
  { id: 'code_lens',       label: 'Code Lens' },
  { id: 'explain_diagram', label: 'Explain Diagram' },
]

const STANDARD_DIAGRAM_TYPES = new Set(['bpmn', 'uml_sequence', 'erd', 'flowchart', 'c4_l1', 'c4_l2', 'user_flow', 'uml_class', 'c4'])

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────
interface ProjectShellProps {
  email: string
  fullName: string | null
  generationsRemaining: number
  plan: string
  project: ProjectType
  diagrams: DiagramSummary[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
export function ProjectShell({
  email,
  fullName,
  generationsRemaining,
  plan,
  project: initialProject,
  diagrams: initialDiagrams,
}: ProjectShellProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const [generateOpen, setGenerateOpen] = useState(false)
  const [diagrams, setDiagrams] = useState(initialDiagrams)
  const [explainArtifacts, setExplainArtifacts] = useState<Artifact[]>([])
  const [codeLensArtifacts, setCodeLensArtifacts] = useState<Artifact[]>([])
  const [project, setProject] = useState(initialProject)
  const [allProjects, setAllProjects] = useState<ProjectType[]>([])
  const [isRenamingProject, setIsRenamingProject] = useState(false)
  const [renameValue, setRenameValue] = useState(initialProject.name)
  // Shared card rename state (used for diagrams + artifacts)
  const [renamingCardId, setRenamingCardId] = useState<string | null>(null)
  const [cardRenameValue, setCardRenameValue] = useState('')
  const [renamingCardType, setRenamingCardType] = useState<'diagram' | 'code_lens' | 'explain'>('diagram')
  const [activeTab, setActiveTab] = useState<Tab>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('updated_desc')
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('ws-view') as ViewMode) ?? 'grid'
    return 'grid'
  })

  // Load all projects for "Move to project" submenu
  useEffect(() => { getUserProjects().then(setAllProjects).catch(() => {}) }, [])

  // Load artifacts for this project
  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('artifacts').select('*')
      .eq('project_id', project.id).eq('type', 'explain_diagram')
      .order('updated_at', { ascending: false })
      .then(({ data }) => { if (data) setExplainArtifacts(data as Artifact[]) })
    supabase
      .from('artifacts').select('*')
      .eq('project_id', project.id).eq('type', 'code_lens')
      .order('updated_at', { ascending: false })
      .then(({ data }) => { if (data) setCodeLensArtifacts(data as Artifact[]) })
  }, [project.id])

  // Register this project as active context for [+ New] modal pre-selection
  const { setActiveProject } = useActiveProject()
  useEffect(() => {
    setActiveProject(project.id, project.name, project.is_default)
    return () => setActiveProject(null, null)
  }, [project.id, project.name, project.is_default, setActiveProject])

  const T = {
    tabText:         isDark ? 'rgba(161,161,170,0.8)' : '#6B7280',
    tabActiveText:   isDark ? '#F1F5F9'               : '#111827',
    tabActiveBorder: '#6366F1',
    listRowBg:       isDark ? 'rgba(255,255,255,0.02)' : '#FAFAFA',
    listRowBorder:   isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    listRowHover:    isDark ? 'rgba(255,255,255,0.04)' : '#F3F4F6',
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const h = Math.floor(mins / 60)
    if (h < 24) return `${h}h ago`
    const days = Math.floor(h / 24)
    if (days < 7) return `${days}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  // ── Diagram handlers ──────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('diagrams').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setDiagrams(prev => prev.filter(d => d.id !== id))
    toast.success('Diagram deleted')
  }

  async function handleMoveToProject(diagramId: string, targetProjectId: string | null) {
    const originalProjectId = diagrams.find(d => d.id === diagramId)?.project_id ?? null
    const ok = await moveDiagramToProject(diagramId, targetProjectId)
    if (!ok) { toast.error('Failed to move'); return }
    setDiagrams(prev => prev.filter(d => d.id !== diagramId))
    const pName = allProjects.find(p => p.id === targetProjectId)?.name ?? 'workspace'
    toast.success(targetProjectId ? `Moved to "${pName}"` : 'Removed from project', {
      action: { label: 'Undo', onClick: () => handleMoveToProject(diagramId, originalProjectId) },
    })
  }

  // ── Explain Diagram artifact handlers ─────────────────────────────────────
  async function handleDeleteArtifact(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('artifacts').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setExplainArtifacts(prev => prev.filter(a => a.id !== id))
    toast.success('Deleted')
  }

  async function handleMoveArtifactToProject(artifactId: string, targetProjectId: string | null) {
    const originalProjectId = explainArtifacts.find(a => a.id === artifactId)?.project_id ?? null
    const ok = await moveArtifactToProject(artifactId, targetProjectId)
    if (!ok) { toast.error('Failed to move'); return }
    setExplainArtifacts(prev => prev.filter(a => a.id !== artifactId))
    const pName = allProjects.find(p => p.id === targetProjectId)?.name ?? 'workspace'
    toast.success(targetProjectId ? `Moved to "${pName}"` : 'Removed from project', {
      action: { label: 'Undo', onClick: () => handleMoveArtifactToProject(artifactId, originalProjectId) },
    })
  }

  // ── Code Lens artifact handlers ───────────────────────────────────────────
  async function handleDeleteCodeLensArtifact(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('artifacts').delete().eq('id', id)
    if (error) { toast.error('Failed to delete'); return }
    setCodeLensArtifacts(prev => prev.filter(a => a.id !== id))
    toast.success('Deleted')
  }

  async function handleMoveCodeLensToProject(artifactId: string, targetProjectId: string | null) {
    const originalProjectId = codeLensArtifacts.find(a => a.id === artifactId)?.project_id ?? null
    const ok = await moveArtifactToProject(artifactId, targetProjectId)
    if (!ok) { toast.error('Failed to move'); return }
    setCodeLensArtifacts(prev => prev.filter(a => a.id !== artifactId))
    const pName = allProjects.find(p => p.id === targetProjectId)?.name ?? 'workspace'
    toast.success(targetProjectId ? `Moved to "${pName}"` : 'Removed from project', {
      action: { label: 'Undo', onClick: () => handleMoveCodeLensToProject(artifactId, originalProjectId) },
    })
  }

  // ── Project rename ────────────────────────────────────────────────────────
  async function handleRenameProject() {
    const name = renameValue.trim()
    if (!name || name === project.name) { setIsRenamingProject(false); return }
    const ok = await renameProject(project.id, name)
    if (ok) {
      setProject(prev => ({ ...prev, name }))
      toast.success('Project renamed')
    } else {
      toast.error('Failed to rename project')
    }
    setIsRenamingProject(false)
  }

  // ── Card rename (shared for diagrams + artifacts) ─────────────────────────
  async function handleConfirmCardRename(id: string) {
    const name = cardRenameValue.trim()
    setRenamingCardId(null)
    if (!name) return
    if (renamingCardType === 'diagram') {
      const ok = await renameDiagram(id, name)
      if (!ok) { toast.error('Failed to rename'); return }
      setDiagrams(prev => prev.map(d => d.id === id ? { ...d, title: name } : d))
    } else if (renamingCardType === 'code_lens') {
      const ok = await renameArtifact(id, name)
      if (!ok) { toast.error('Failed to rename'); return }
      setCodeLensArtifacts(prev => prev.map(a => a.id === id ? { ...a, title: name } : a))
    } else {
      const ok = await renameArtifact(id, name)
      if (!ok) { toast.error('Failed to rename'); return }
      setExplainArtifacts(prev => prev.map(a => a.id === id ? { ...a, title: name } : a))
    }
  }

  // ── Filtered data ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let d = [...diagrams]
    if (activeTab === 'diagrams') d = d.filter(x => STANDARD_DIAGRAM_TYPES.has(x.diagram_type))
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

  // ── Card preview components ───────────────────────────────────────────────

  function ApiLensPreview({ flowData }: { flowData: Record<string, unknown> | null | undefined }) {
    const services = Array.isArray(flowData?.services)
      ? (flowData!.services as Array<{ name?: string; endpoints?: unknown[] }>)
      : []
    const displayServices = services.slice(0, 5)

    return (
      <div style={{
        width: '100%', height: '100%',
        background: isDark ? '#0D0D14' : '#F8F7FF',
        borderRadius: 8, padding: '14px 16px',
        display: 'flex', flexDirection: 'column', gap: 7,
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          fontSize: 9, fontFamily: 'Inter, sans-serif', fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase' as const,
          color: isDark ? 'rgba(99,102,241,0.7)' : 'rgba(79,70,229,0.7)',
          marginBottom: 2,
        }}>
          C4 Architecture
        </div>

        {displayServices.length > 0 ? displayServices.map((svc, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
              background: isDark ? 'rgba(99,102,241,0.6)' : 'rgba(79,70,229,0.5)',
            }} />
            <div style={{
              fontSize: 10, fontFamily: 'Inter, sans-serif',
              color: isDark ? 'rgba(241,245,249,0.7)' : 'rgba(15,23,42,0.65)',
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1,
            }}>
              {svc.name ?? '—'}
            </div>
            {Array.isArray(svc.endpoints) && svc.endpoints.length > 0 && (
              <div style={{
                fontSize: 9, flexShrink: 0,
                color: isDark ? 'rgba(99,102,241,0.5)' : 'rgba(79,70,229,0.4)',
              }}>
                {svc.endpoints.length} ep
              </div>
            )}
          </div>
        )) : [60, 80, 45, 70, 55].map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <div style={{
              width: 5, height: 5, borderRadius: '50%',
              background: isDark ? 'rgba(99,102,241,0.3)' : 'rgba(79,70,229,0.2)',
            }} />
            <div style={{
              height: 7, width: `${w}%`, borderRadius: 3,
              background: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
            }} />
          </div>
        ))}

        <svg style={{ position: 'absolute', bottom: 8, right: 8, opacity: 0.15 }}
          width="40" height="40" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="12" fill="none"
            stroke={isDark ? '#6366F1' : '#4F46E5'} strokeWidth="1.5" />
          <line x1="20" y1="8" x2="20" y2="32"
            stroke={isDark ? '#6366F1' : '#4F46E5'} strokeWidth="1" />
          <line x1="8" y1="20" x2="32" y2="20"
            stroke={isDark ? '#6366F1' : '#4F46E5'} strokeWidth="1" />
        </svg>
      </div>
    )
  }

  function CodeLensPreview({ content }: { content: Record<string, unknown> | null | undefined }) {
    const doc = content?.documentation as Record<string, unknown> | undefined
    const summary = typeof doc?.summary === 'string' ? doc.summary : ''
    const rules = Array.isArray(doc?.business_rules)
      ? (doc!.business_rules as string[])
      : []
    const language = typeof content?.language === 'string' ? content.language : 'Code'
    const hasDiagram = !!content?.diagramType && content.diagramType !== null

    const previewLines = rules.length > 0
      ? rules.slice(0, 4)
      : summary
        ? [summary.slice(0, 50), summary.slice(50, 100)].filter(Boolean)
        : []

    return (
      <div style={{
        width: '100%', height: '100%',
        background: isDark ? '#0A0A12' : '#F9FAFB',
        borderRadius: 8, padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 4,
        overflow: 'hidden', position: 'relative',
        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      }}>
        <div style={{
          fontSize: 8, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: isDark ? 'rgba(99,102,241,0.8)' : 'rgba(79,70,229,0.7)',
          marginBottom: 5, fontFamily: 'Inter, sans-serif',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <span>{language} · Docs</span>
          {hasDiagram && (
            <span style={{ color: isDark ? 'rgba(34,197,94,0.65)' : 'rgba(22,163,74,0.6)' }}>
              + Diagram
            </span>
          )}
        </div>

        {previewLines.length > 0 ? previewLines.map((line, i) => (
          <div key={i} style={{
            fontSize: 9, lineHeight: 1.6,
            color: isDark ? 'rgba(241,245,249,0.55)' : 'rgba(15,23,42,0.5)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            <span style={{
              color: isDark ? 'rgba(99,102,241,0.5)' : 'rgba(79,70,229,0.4)',
              marginRight: 8, userSelect: 'none' as const,
            }}>
              {String(i + 1).padStart(2, '0')}
            </span>
            {line}
          </div>
        )) : [75, 55, 90, 40].map((w, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
            <div style={{
              width: 14, height: 7, borderRadius: 2, flexShrink: 0,
              background: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(79,70,229,0.15)',
            }} />
            <div style={{
              height: 7, width: `${w}%`, borderRadius: 3,
              background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
            }} />
          </div>
        ))}

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
          background: isDark
            ? 'linear-gradient(to bottom, transparent, #0A0A12)'
            : 'linear-gradient(to bottom, transparent, #F9FAFB)',
          borderRadius: '0 0 8px 8px',
        }} />
      </div>
    )
  }

  function ExplainPreview({ content }: { content: Record<string, unknown> | null | undefined }) {
    const sections = content?.sections as Record<string, string> | undefined
    const overview =
      (sections?.OVERVIEW ?? sections?.Overview ?? sections?.overview) ||
      (typeof content?.explanation === 'string' ? (content.explanation as string).slice(0, 150) : '') ||
      ''

    return (
      <div style={{
        width: '100%', height: '100%',
        background: isDark ? '#0A0F12' : '#F0FDFA',
        borderRadius: 8, padding: '12px 14px',
        display: 'flex', flexDirection: 'column', gap: 8,
        overflow: 'hidden', position: 'relative',
      }}>
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          color: isDark ? 'rgba(20,184,166,0.7)' : 'rgba(13,148,136,0.7)',
          fontFamily: 'Inter, sans-serif',
        }}>
          Diagram Explanation
        </div>

        {overview ? (
          <div style={{
            fontSize: 10, lineHeight: 1.7,
            color: isDark ? 'rgba(241,245,249,0.6)' : 'rgba(15,23,42,0.55)',
            fontFamily: 'Inter, sans-serif',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 4,
            WebkitBoxOrient: 'vertical' as const,
          }}>
            {overview}
          </div>
        ) : [85, 70, 90, 60].map((w, i) => (
          <div key={i} style={{
            height: 7, width: `${w}%`, borderRadius: 3,
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
          }} />
        ))}

        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 28,
          background: isDark
            ? 'linear-gradient(to bottom, transparent, #0A0F12)'
            : 'linear-gradient(to bottom, transparent, #F0FDFA)',
          borderRadius: '0 0 8px 8px',
        }} />
      </div>
    )
  }

  // ── Cards ─────────────────────────────────────────────────────────────────
  function DiagramCard({ d }: { d: DiagramSummary }) {
    const isRenaming = renamingCardId === d.id && renamingCardType === 'diagram'
    return (
      <div className="diagram-card group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow hover:shadow-md"
        style={{ overflow: 'hidden' }}>
        <Link href={diagramPath(d)} className="block">
          <div style={{
            height: 160, background: 'var(--color-surface-raised)',
            position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', borderBottom: '1px solid var(--color-border)',
            borderRadius: '8px 8px 0 0', padding: 12,
          }}>
            {d.diagram_type === 'api_lens' ? (
              <div style={{ width: '100%', height: '100%' }}>
                <ApiLensPreview flowData={d.flow_data} />
              </div>
            ) : d.preview_svg ? (
              <div className="preview-svg-wrap" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                dangerouslySetInnerHTML={{ __html: d.preview_svg }} />
            ) : (
              <FileText className="h-8 w-8 text-[var(--color-text-tertiary)]" strokeWidth={1} />
            )}
            <div className="thumbnail-overlay"><span className="thumbnail-overlay-label">Open →</span></div>
          </div>
        </Link>
        <div style={{ padding: '12px 14px' }}>
          {isRenaming ? (
            <input autoFocus value={cardRenameValue} onChange={e => setCardRenameValue(e.target.value)}
              onBlur={() => handleConfirmCardRename(d.id)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirmCardRename(d.id); if (e.key === 'Escape') setRenamingCardId(null) }}
              style={{ width: '100%', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)', background: 'transparent', border: 'none', borderBottom: '2px solid #6366F1', outline: 'none', padding: '0 0 2px' }}
            />
          ) : (
            <p className="truncate text-[var(--color-text-primary)]" style={{ fontSize: 14, fontWeight: 600 }}>{d.title}</p>
          )}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            {(() => { const s = getTypeStyle(d.diagram_type); return (
              <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif', background: s.bg, color: s.color }}>{s.label}</span>
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
            <DropdownMenuItem onClick={() => { setRenamingCardType('diagram'); setRenamingCardId(d.id); setCardRenameValue(d.title) }}>
              <Pencil className="mr-2 h-4 w-4" strokeWidth={1.5} />Rename
            </DropdownMenuItem>
            {allProjects.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><FolderInput className="mr-2 h-4 w-4" strokeWidth={1.5} />Move to project</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleMoveToProject(d.id, null)}>— No project</DropdownMenuItem>
                  {allProjects.filter(p => p.id !== project.id).map(p => (
                    <DropdownMenuItem key={p.id} onClick={() => handleMoveToProject(d.id, p.id)}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', marginRight: 8 }} />{p.name}
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
  }

  function ExplainArtifactCard({ a }: { a: Artifact }) {
    const isRenaming = renamingCardId === a.id && renamingCardType === 'explain'
    return (
      <div className="diagram-card group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow hover:shadow-md" style={{ overflow: 'hidden' }}>
        <Link href={`/workspace/explain-diagram/${a.id}`} className="block">
          <div style={{ height: 160, background: 'var(--color-surface-raised)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--color-border)', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', padding: 0 }}>
              <ExplainPreview content={a.content} />
            </div>
            <div className="thumbnail-overlay"><span className="thumbnail-overlay-label">Open →</span></div>
          </div>
        </Link>
        <div style={{ padding: '12px 14px' }}>
          {isRenaming ? (
            <input autoFocus value={cardRenameValue} onChange={e => setCardRenameValue(e.target.value)}
              onBlur={() => handleConfirmCardRename(a.id)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirmCardRename(a.id); if (e.key === 'Escape') setRenamingCardId(null) }}
              style={{ width: '100%', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)', background: 'transparent', border: 'none', borderBottom: '2px solid #14B8A6', outline: 'none', padding: '0 0 2px' }}
            />
          ) : (
            <p className="truncate text-[var(--color-text-primary)]" style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</p>
          )}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif', background: 'rgba(20,184,166,0.15)', color: '#0D9488' }}>Explain</span>
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
            <DropdownMenuItem onClick={() => { setRenamingCardType('explain'); setRenamingCardId(a.id); setCardRenameValue(a.title) }}>
              <Pencil className="mr-2 h-4 w-4" strokeWidth={1.5} />Rename
            </DropdownMenuItem>
            {allProjects.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><FolderInput className="mr-2 h-4 w-4" strokeWidth={1.5} />Move to project</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleMoveArtifactToProject(a.id, null)}>— No project</DropdownMenuItem>
                  {allProjects.filter(p => p.id !== project.id).map(p => (
                    <DropdownMenuItem key={p.id} onClick={() => handleMoveArtifactToProject(a.id, p.id)}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', marginRight: 8 }} />{p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[var(--color-danger)]" onClick={() => handleDeleteArtifact(a.id)}>
              <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.5} />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  function CodeLensArtifactCard({ a }: { a: Artifact }) {
    const isRenaming = renamingCardId === a.id && renamingCardType === 'code_lens'
    return (
      <div className="diagram-card group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow hover:shadow-md" style={{ overflow: 'hidden' }}>
        <Link href={`/workspace/code-lens/${a.id}`} className="block">
          <div style={{ height: 160, background: 'var(--color-surface-raised)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderBottom: '1px solid var(--color-border)', borderRadius: '8px 8px 0 0', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', padding: 0 }}>
              <CodeLensPreview content={a.content} />
            </div>
            <div className="thumbnail-overlay"><span className="thumbnail-overlay-label">Open →</span></div>
          </div>
        </Link>
        <div style={{ padding: '12px 14px' }}>
          {isRenaming ? (
            <input autoFocus value={cardRenameValue} onChange={e => setCardRenameValue(e.target.value)}
              onBlur={() => handleConfirmCardRename(a.id)}
              onKeyDown={e => { if (e.key === 'Enter') handleConfirmCardRename(a.id); if (e.key === 'Escape') setRenamingCardId(null) }}
              style={{ width: '100%', fontSize: 14, fontWeight: 600, fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)', background: 'transparent', border: 'none', borderBottom: '2px solid #6366F1', outline: 'none', padding: '0 0 2px' }}
            />
          ) : (
            <p className="truncate text-[var(--color-text-primary)]" style={{ fontSize: 14, fontWeight: 600 }}>{a.title}</p>
          )}
          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif', background: 'rgba(99,102,241,0.15)', color: '#A5B4FC' }}>Code Lens</span>
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
            <DropdownMenuItem onClick={() => { setRenamingCardType('code_lens'); setRenamingCardId(a.id); setCardRenameValue(a.title) }}>
              <Pencil className="mr-2 h-4 w-4" strokeWidth={1.5} />Rename
            </DropdownMenuItem>
            {allProjects.length > 0 && (
              <DropdownMenuSub>
                <DropdownMenuSubTrigger><FolderInput className="mr-2 h-4 w-4" strokeWidth={1.5} />Move to project</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => handleMoveCodeLensToProject(a.id, null)}>— No project</DropdownMenuItem>
                  {allProjects.filter(p => p.id !== project.id).map(p => (
                    <DropdownMenuItem key={p.id} onClick={() => handleMoveCodeLensToProject(a.id, p.id)}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', marginRight: 8 }} />{p.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-[var(--color-danger)]" onClick={() => handleDeleteCodeLensArtifact(a.id)}>
              <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.5} />Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  function EmptyState() {
    const isSearch = search.trim().length > 0
    const tabLabel =
      activeTab === 'code_lens' ? 'Code Lens analyses' :
      activeTab === 'explain_diagram' ? 'diagram explanations' :
      activeTab === 'api_lens' ? 'API Lens diagrams' :
      activeTab === 'diagrams' ? 'diagrams' : 'artifacts'

    const ctaHref =
      activeTab === 'code_lens' ? '/workspace/code-lens' :
      activeTab === 'explain_diagram' ? '/workspace/explain-diagram' : null

    return (
      <div className="flex flex-1 items-center justify-center pt-20">
        <div className="flex max-w-sm flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-subtle)]">
            <GitBranch className="h-8 w-8 text-[var(--color-accent-brand)]" strokeWidth={1.5} />
          </div>
          <h1 className="mt-6 text-xl font-semibold text-[var(--color-text-primary)]">
            {isSearch ? 'No results found' : `No ${tabLabel} in this project`}
          </h1>
          <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
            {isSearch
              ? `Nothing matches "${search}"`
              : activeTab === 'code_lens'
              ? 'Run Code Lens on any code file to generate documentation and diagrams.'
              : activeTab === 'explain_diagram'
              ? 'Upload a diagram image to get a plain English explanation.'
              : 'Generate a diagram to add it to this project.'
            }
          </p>
          {!isSearch && (
            ctaHref ? (
              <Link href={ctaHref} className="mt-6" style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontSize: 13, fontWeight: 600, textDecoration: 'none', fontFamily: 'Inter, sans-serif' }}>
                Open {activeTab === 'code_lens' ? 'Code Lens' : 'Explain Diagram'} →
              </Link>
            ) : (
              <button onClick={() => setGenerateOpen(true)} className="mt-6" style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'Inter, sans-serif' }}>
                <Sparkles size={14} strokeWidth={1.5} />
                Generate a diagram
              </button>
            )
          )}
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render helpers — list row for non-diagram artifacts
  // ─────────────────────────────────────────────────────────────────────────
  function ArtifactListRow({ a, href, dotColor, badge, badgeBg, badgeColor }: {
    a: Artifact; href: string; dotColor: string; badge: string; badgeBg: string; badgeColor: string
  }) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.listRowBorder}`, background: T.listRowBg, transition: 'background 0.15s', cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.background = T.listRowHover }}
          onMouseLeave={e => { e.currentTarget.style.background = T.listRowBg }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
          <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</span>
          <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: badgeBg, color: badgeColor, flexShrink: 0 }}>{badge}</span>
          <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{formatDate(a.updated_at)}</span>
        </div>
      </Link>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      <AppNavbar email={email} fullName={fullName} generationsRemaining={generationsRemaining} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar plan={plan} onNewDiagram={() => setGenerateOpen(true)} />

        <main className="flex flex-1 flex-col overflow-auto">
          <div className="p-6">
            {/* ── Project header (unchanged) ── */}
            <div className="mb-5 flex items-center justify-between">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: project.color, flexShrink: 0 }} />

                {isRenamingProject ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onBlur={handleRenameProject}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleRenameProject()
                        if (e.key === 'Escape') { setIsRenamingProject(false); setRenameValue(project.name) }
                      }}
                      style={{ fontSize: 22, fontWeight: 700, fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)', background: 'transparent', border: 'none', borderBottom: '2px solid #6366F1', outline: 'none', padding: '0 2px', minWidth: 120 }}
                    />
                    <button onClick={handleRenameProject} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22C55E' }}><Check size={16} /></button>
                    <button onClick={() => { setIsRenamingProject(false); setRenameValue(project.name) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#52525B' : '#9CA3AF' }}><X size={16} /></button>
                  </div>
                ) : (
                  <h1 className="text-xl font-bold text-[var(--color-text-primary)] cursor-pointer" onClick={() => setIsRenamingProject(true)} title="Click to rename">
                    {project.name}
                  </h1>
                )}

                <button
                  onClick={() => { setIsRenamingProject(true); setRenameValue(project.name) }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDark ? '#3F3F46' : '#D1D5DB', padding: 4 }}
                  title="Rename project"
                >
                  <Pencil size={13} />
                </button>
              </div>
            </div>

            {/* ── Tab bar (all 5 tabs) ── */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.07)' : '#F3F4F6'}` }}>
              {TABS.map(tab => {
                const isActive = activeTab === tab.id
                return (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                    padding: '7px 14px', border: 'none',
                    borderBottom: isActive ? `2px solid ${T.tabActiveBorder}` : '2px solid transparent',
                    background: 'none', cursor: 'pointer',
                    fontSize: 13, fontWeight: isActive ? 600 : 400,
                    fontFamily: 'Inter, sans-serif',
                    color: isActive ? T.tabActiveText : T.tabText,
                    transition: 'all 0.12s ease', marginBottom: -1,
                  }}>
                    {tab.label}
                  </button>
                )
              })}
            </div>

            <WorkspaceToolbar search={search} sort={sort} view={view} onSearch={setSearch} onSort={setSort} onView={setView} />

            {/* ── Content ── */}
            {activeTab === 'explain_diagram' ? (
              filteredExplain.length === 0 ? <EmptyState /> :
              view === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredExplain.map(a => <ExplainArtifactCard key={a.id} a={a} />)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredExplain.map(a => (
                    <ArtifactListRow key={a.id} a={a} href={`/workspace/explain-diagram/${a.id}`} dotColor="#14B8A6" badge="Explain" badgeBg="rgba(20,184,166,0.15)" badgeColor="#0D9488" />
                  ))}
                </div>
              )
            ) : activeTab === 'code_lens' ? (
              filteredCodeLens.length === 0 ? <EmptyState /> :
              view === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredCodeLens.map(a => <CodeLensArtifactCard key={a.id} a={a} />)}
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {filteredCodeLens.map(a => (
                    <ArtifactListRow key={a.id} a={a} href={`/workspace/code-lens/${a.id}`} dotColor="#6366F1" badge="Code Lens" badgeBg="rgba(99,102,241,0.15)" badgeColor="#A5B4FC" />
                  ))}
                </div>
              )
            ) : filtered.length === 0 ? <EmptyState /> :
            view === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map(d => <DiagramCard key={d.id} d={d} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filtered.map(d => {
                  const badge = getTypeStyle(d.diagram_type)
                  const dotColor = TYPE_COLORS[d.diagram_type] ?? '#71717A'
                  return (
                    <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 8, border: `1px solid ${T.listRowBorder}`, background: T.listRowBg, transition: 'background 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = T.listRowHover }}
                      onMouseLeave={e => { e.currentTarget.style.background = T.listRowBg }}
                    >
                      <Link href={diagramPath(d)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.title}</span>
                        <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: badge.bg, color: badge.color, flexShrink: 0 }}>{badge.label}</span>
                        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{formatDate(d.updated_at)}</span>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4, borderRadius: 4 }}>
                            <MoreHorizontal size={14} strokeWidth={1.5} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setRenamingCardType('diagram'); setRenamingCardId(d.id); setCardRenameValue(d.title) }}>
                            <Pencil className="mr-2 h-4 w-4" strokeWidth={1.5} />Rename
                          </DropdownMenuItem>
                          {allProjects.length > 0 && (
                            <DropdownMenuSub>
                              <DropdownMenuSubTrigger><FolderInput className="mr-2 h-4 w-4" strokeWidth={1.5} />Move to project</DropdownMenuSubTrigger>
                              <DropdownMenuSubContent>
                                <DropdownMenuItem onClick={() => handleMoveToProject(d.id, null)}>— No project</DropdownMenuItem>
                                {allProjects.filter(p => p.id !== project.id).map(p => (
                                  <DropdownMenuItem key={p.id} onClick={() => handleMoveToProject(d.id, p.id)}>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.color, display: 'inline-block', marginRight: 8 }} />{p.name}
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
    </div>
  )
}
