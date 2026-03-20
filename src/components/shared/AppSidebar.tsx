'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Plus, ChevronRight, MoreHorizontal, Pencil, Trash2, Check, X, ArrowUpRight, MessageCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { GenerateDialog } from '@/components/workspace/GenerateDialog'
import { NewArtifactModal } from '@/components/workspace/NewArtifactModal'
import { GenerationLimitUpgradeModal } from '@/components/shared/GenerationLimitUpgradeModal'
import {
  getUserProjects,
  getProjectDiagrams,
  getRecentDiagrams,
  createProject,
  renameProject,
  updateProjectColor,
  deleteProject,
  relativeTime,
} from '@/lib/projects'
import { useActiveProject } from '@/lib/context/active-project-context'
import type { Project, DiagramSummary } from '@/types/diagram'

// ─────────────────────────────────────────────────────────────────────────────
// Theme tokens
// ─────────────────────────────────────────────────────────────────────────────
function useTokens(isDark: boolean) {
  return {
    bg:            isDark ? '#09090B'               : '#F7F7F8',
    text:          isDark ? 'rgba(161,161,170,0.9)' : '#0F0F13',
    textActive:    isDark ? '#C4B5FD'               : '#0F0F13',
    textMuted:     isDark ? '#52525B'               : '#A1A1AA',
    sectionLabel:  isDark ? '#3F3F46'               : '#A1A1AA',
    activeBg:      isDark ? 'rgba(99,102,241,0.10)' : '#EAEAF0',
    border:        isDark ? 'rgba(255,255,255,0.06)' : '#E4E4E7',
    divider:       isDark ? 'rgba(255,255,255,0.06)' : '#E4E4E7',
    menuBg:        isDark ? '#1C1C1F'               : '#FFFFFF',
    menuBorder:    isDark ? 'rgba(255,255,255,0.10)' : '#E4E4E7',
    menuShadow:    isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 4px 16px rgba(0,0,0,0.08)',
    upgradeTitle:  isDark ? '#C4B5FD'               : '#5B5BD6',
    upgradeDesc:   isDark ? '#71717A'               : '#52525B',
    newBtnBg:      isDark ? 'rgba(99,102,241,0.18)' : '#5B5BD6',
    newBtnBorder:  isDark ? 'rgba(99,102,241,0.35)' : '#5B5BD6',
    newBtnColor:   isDark ? '#A5B4FC'               : '#FFFFFF',
    dotColor:      isDark ? '#3F3F46'               : '#D1D5DB',
  }
}

function rowStyle(isActive: boolean, T: ReturnType<typeof useTokens>): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '6px 10px', marginLeft: 4, marginRight: 4,
    borderRadius: 7, cursor: 'pointer',
    fontSize: 12.5, fontFamily: 'Inter, sans-serif',
    fontWeight: isActive ? 500 : 400, textDecoration: 'none',
    color: isActive ? T.textActive : T.text,
    background: isActive ? T.activeBg : 'transparent',
    borderLeft: `2px solid ${isActive ? 'rgba(99,102,241,0.55)' : 'transparent'}`,
    paddingLeft: isActive ? 8 : 10,
    transition: 'all 0.12s ease',
  }
}

// Diagram type → short label and color
const TYPE_META: Record<string, { color: string; short: string }> = {
  bpmn:         { color: '#6366F1', short: 'BPMN' },
  uml_sequence: { color: '#22C55E', short: 'UML' },
  erd:          { color: '#3B82F6', short: 'ERD' },
  flowchart:    { color: '#F59E0B', short: 'Flow' },
  c4_l1:        { color: '#A78BFA', short: 'C4' },
  c4_l2:        { color: '#8B5CF6', short: 'C4' },
  api_lens:     { color: '#06B6D4', short: 'API' },
}

const PROJECT_COLORS = ['#6366F1', '#22C55E', '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6', '#EF4444', '#8B5CF6']

// ─────────────────────────────────────────────────────────────────────────────
// Props (simplified — sidebar manages its own data)
// ─────────────────────────────────────────────────────────────────────────────
export interface AppSidebarProps {
  plan: string
  generationsRemaining: number
  /** Called when user confirms "Generate diagram" inside the new-artifact modal */
  onNewDiagram?: () => void
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────
export function AppSidebar({ plan, generationsRemaining, onNewDiagram }: AppSidebarProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const T = useTokens(isDark)
  const pathname = usePathname()
  const router = useRouter()
  const { activeProjectName, activeProjectIsDefault } = useActiveProject()

  // ── Data state ──────────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([])
  const [projectDiagrams, setProjectDiagrams] = useState<Record<string, DiagramSummary[]>>({})
  const [recentDiagrams, setRecentDiagrams] = useState<DiagramSummary[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  // ── UI state ────────────────────────────────────────────────────────────────
  const [expandedProjects, setExpandedProjects] = useState<Set<string>>(new Set())
  const [newArtifactOpen, setNewArtifactOpen] = useState(false)
  const [generateOpen, setGenerateOpen] = useState(false)
  const [generationLimitModalOpen, setGenerationLimitModalOpen] = useState(false)

  // New project inline form
  const [creatingProject, setCreatingProject] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [newProjectColor, setNewProjectColor] = useState('#6366F1')
  const [savingProject, setSavingProject] = useState(false)
  const [createProjectError, setCreateProjectError] = useState<string | null>(null)
  const newProjectInputRef = useRef<HTMLInputElement>(null)

  // Project context menu
  const [projectMenu, setProjectMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [renamingProject, setRenamingProject] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const isConfirmingRef = useRef(false)
  const activeRenamingProjectIdRef = useRef<string | null>(null)
  const [showNewProjectTooltip, setShowNewProjectTooltip] = useState(false)
  const tooltipTimerRef = useRef<number | null>(null)

  // ── Fetch data ──────────────────────────────────────────────────────────────
  const loadProjects = useCallback(async () => {
    setLoadingProjects(true)
    const [fetchedProjects, fetchedRecent] = await Promise.all([
      getUserProjects(),
      getRecentDiagrams(5),
    ])
    setProjects(fetchedProjects)
    setRecentDiagrams(fetchedRecent)
    setLoadingProjects(false)

    // Auto-expand default project
    const defaultP = fetchedProjects.find(p => p.is_default)
    if (defaultP) {
      setExpandedProjects(prev => new Set([...prev, defaultP.id]))
      loadProjectDiagrams(defaultP.id)
    }
  }, [])

  const loadProjectDiagrams = useCallback(async (projectId: string) => {
    const diagrams = await getProjectDiagrams(projectId)
    setProjectDiagrams(prev => ({ ...prev, [projectId]: diagrams }))
  }, [])

  useEffect(() => { loadProjects() }, [loadProjects])

  const toggleProject = (projectId: string) => {
    setExpandedProjects(prev => {
      const next = new Set(prev)
      if (next.has(projectId)) {
        next.delete(projectId)
      } else {
        next.add(projectId)
        if (!projectDiagrams[projectId]) loadProjectDiagrams(projectId)
      }
      return next
    })
  }

  // ── New project ─────────────────────────────────────────────────────────────
  const startCreatingProject = () => {
    setCreatingProject(true)
    setNewProjectName('')
    setNewProjectColor('#6366F1')
    setCreateProjectError(null)
    setTimeout(() => newProjectInputRef.current?.focus(), 50)
  }

  const dismissCreateProject = () => {
    setCreatingProject(false)
    setNewProjectName('')
    setNewProjectColor('#6366F1')
    setCreateProjectError(null)
  }

  const confirmCreateProject = async () => {
    const name = newProjectName.trim()
    if (!name || savingProject) return

    setSavingProject(true)
    setCreateProjectError(null)

    try {
      const created = await createProject(name, newProjectColor)
      if (!created) throw new Error('Insert returned null')

      // Optimistic: add to local state immediately
      setProjects(prev => [...prev, created])
      setExpandedProjects(prev => new Set([...prev, created.id]))
      setProjectDiagrams(prev => ({ ...prev, [created.id]: [] }))

      // Reset + close form
      setCreatingProject(false)
      setNewProjectName('')
      setNewProjectColor('#6366F1')
    } catch (err) {
      console.error('[createProject]', err)
      setCreateProjectError('Could not create project. Please try again.')
    } finally {
      setSavingProject(false)
    }
  }

  // ── Rename project ──────────────────────────────────────────────────────────
  const startRenaming = (projectId: string, currentName: string) => {
    activeRenamingProjectIdRef.current = projectId
    setRenamingProject(projectId)
    setRenameValue(currentName)
    setTimeout(() => setProjectMenu(null), 0)
  }

  const confirmRename = async (projectId: string) => {
    if (isConfirmingRef.current) {
      return
    }
    isConfirmingRef.current = true
    const targetProjectId = activeRenamingProjectIdRef.current ?? projectId

    const name = renameValue.trim()
    if (name) {
      const success = await renameProject(targetProjectId, name)
      if (success) {
        setProjects(prev => prev.map(p => p.id === targetProjectId ? { ...p, name } : p))
        activeRenamingProjectIdRef.current = null
        setRenamingProject(null)
      } else {
        // keep edit mode open, show error
        toast.error('Failed to rename project. Please try again.')
      }
    } else {
      activeRenamingProjectIdRef.current = null
      setRenamingProject(null)
    }

    isConfirmingRef.current = false
  }

  // ── Delete project ──────────────────────────────────────────────────────────
  const handleDeleteProject = async (projectId: string) => {
    setProjectMenu(null)
    const ok = await deleteProject(projectId)
    if (ok) {
      setProjects(prev => prev.filter(p => p.id !== projectId))
      setProjectDiagrams(prev => { const next = { ...prev }; delete next[projectId]; return next })
      setExpandedProjects(prev => { const next = new Set(prev); next.delete(projectId); return next })
    }
  }

  // ── Update project color ─────────────────────────────────────────────────────
  const handleColorChange = async (projectId: string, color: string) => {
    await updateProjectColor(projectId, color)
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, color } : p))
    setProjectMenu(null)
  }

  // ── Diagram path helper ─────────────────────────────────────────────────────
  function diagramHref(d: DiagramSummary) {
    if (d.diagram_type === 'api_lens') return `/api-lens/${d.id}`
    if (d.diagram_type === 'uml_sequence') return `/sequence/${d.id}`
    return `/diagram/${d.id}`
  }

  const isActiveDiagram = (d: DiagramSummary) =>
    pathname === diagramHref(d) || pathname.includes(d.id)

  // ── Handle "New diagram" from NewArtifactModal ───────────────────────────────
  const handleNewDiagram = () => {
    if (onNewDiagram) {
      onNewDiagram()
    } else {
      setGenerateOpen(true)
    }
  }

  const freeLimitReached = plan === 'free' && generationsRemaining <= 0

  const handleNewClick = () => {
    if (freeLimitReached) {
      setGenerationLimitModalOpen(true)
      return
    }
    setNewArtifactOpen(true)
  }

  const handleContactSupport = () => {
    if (typeof window !== 'undefined' && (window as Window & { $crisp?: unknown[] }).$crisp) {
      ;(window as Window & { $crisp: unknown[] }).$crisp.push(['do', 'chat:open'])
    }
  }

  // ── Close project menu on outside click ─────────────────────────────────────
  useEffect(() => {
    if (!projectMenu) return
    const handler = () => setProjectMenu(null)
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [projectMenu])

  useEffect(() => {
    const DISMISS_KEY = 'flowmapr:new-project-tip-dismissed'

    const dismissTooltip = () => {
      setShowNewProjectTooltip(false)
      localStorage.setItem(DISMISS_KEY, 'true')
      if (tooltipTimerRef.current) {
        window.clearTimeout(tooltipTimerRef.current)
        tooltipTimerRef.current = null
      }
    }

    const handleOnboardingStep = (event: Event) => {
      const custom = event as CustomEvent<{ visible?: boolean }>
      const visible = Boolean(custom.detail?.visible)
      if (!visible) return
      if (localStorage.getItem(DISMISS_KEY) === 'true') return
      setShowNewProjectTooltip(true)
      if (tooltipTimerRef.current) window.clearTimeout(tooltipTimerRef.current)
      tooltipTimerRef.current = window.setTimeout(() => {
        dismissTooltip()
      }, 8000)
    }

    window.addEventListener('flowmapr:onboarding-step1-visible', handleOnboardingStep as EventListener)
    return () => {
      window.removeEventListener('flowmapr:onboarding-step1-visible', handleOnboardingStep as EventListener)
      if (tooltipTimerRef.current) window.clearTimeout(tooltipTimerRef.current)
    }
  }, [])

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <>
      <aside style={{
        width: 240, flexShrink: 0, height: '100%',
        display: 'flex', flexDirection: 'column',
        background: T.bg,
        borderRight: `1px solid ${T.divider}`,
        overflow: 'hidden',
      }}>

        {/* ── [+ New] button ────────────────────────────────────────────────── */}
        <div style={{ padding: '12px 10px 8px' }}>
          <button
            onClick={handleNewClick}
            style={{
              width: '100%', padding: '9px 14px',
              borderRadius: 8, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 13, fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
              background: T.newBtnBg,
              border: `1px solid ${T.newBtnBorder}`,
              color: T.newBtnColor,
              transition: 'all 0.12s ease',
            }}
          >
            <Plus size={14} strokeWidth={2.5} style={{ flexShrink: 0 }} />
            <span>New</span>
            {activeProjectName && !activeProjectIsDefault && (
              <span style={{
                fontSize: 11, fontWeight: 400,
                color: isDark ? '#52525B' : '#A1A1AA',
                marginLeft: 2, overflow: 'hidden',
                textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                maxWidth: 72,
              }}>
                · {activeProjectName.length > 12
                  ? activeProjectName.slice(0, 12) + '…'
                  : activeProjectName}
              </span>
            )}
          </button>
        </div>

        {/* ── Scrollable nav ────────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 8 }}>

          {/* RECENTS */}
          <div style={{ padding: '12px 16px 4px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.sectionLabel, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
              Recents
            </span>
          </div>

          {recentDiagrams.length === 0 && !loadingProjects && (
            <div style={{ padding: '6px 16px', fontSize: 12, color: T.textMuted, fontFamily: 'Inter, sans-serif' }}>
              Your recent items will appear here
            </div>
          )}

          {recentDiagrams.map(d => {
            const meta = TYPE_META[d.diagram_type] ?? { color: '#6366F1', short: '?' }
            const isActive = isActiveDiagram(d)
            return (
              <Link
                key={d.id}
                href={diagramHref(d)}
                className="sidebar-nav-link"
                style={{ ...rowStyle(isActive, T), gap: 9, paddingRight: 10 }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {d.title || 'Untitled'}
                </span>
                <span style={{ fontSize: 10, color: T.textMuted, flexShrink: 0 }}>
                  {relativeTime(d.updated_at)}
                </span>
              </Link>
            )
          })}

          {/* Divider */}
          <div style={{ margin: '10px 14px 6px', height: 1, background: T.divider }} />

          {/* PROJECTS */}
          <div style={{ padding: '4px 16px 4px' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: T.sectionLabel, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'Inter, sans-serif' }}>
              Projects
            </span>
          </div>

          {loadingProjects && (
            <div style={{ padding: '8px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[80, 65, 75].map((w, i) => (
                <div key={i} style={{ height: 10, width: `${w}%`, borderRadius: 4, background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)', animation: 'pulse 1.5s ease infinite', animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
          )}

          {!loadingProjects && projects.map(project => {
            const isExpanded = expandedProjects.has(project.id)
            const diagrams = projectDiagrams[project.id] ?? []
            const isProjectPage = pathname === `/workspace/project/${project.id}`
            const isRenamingThis = renamingProject === project.id

            return (
              <div key={project.id}>
                {/* Project row */}
                <div
                  className="sidebar-nav-link"
                  style={{
                    ...rowStyle(isProjectPage, T),
                    paddingRight: 6,
                    userSelect: 'none',
                  }}
                >
                  {/* Expand chevron */}
                  <button
                    onClick={() => toggleProject(project.id)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', flexShrink: 0, color: T.textMuted }}
                  >
                    <ChevronRight
                      size={13}
                      style={{
                        transition: 'transform 0.15s ease',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      }}
                    />
                  </button>

                  {/* Color dot */}
                  <span
                    onClick={() => router.push(`/workspace/project/${project.id}`)}
                    style={{ width: 8, height: 8, borderRadius: '50%', background: project.color, flexShrink: 0, cursor: 'pointer' }}
                  />

                  {/* Name (editable) */}
                  {isRenamingThis ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmRename(project.id)
                        if (e.key === 'Escape') {
                          activeRenamingProjectIdRef.current = null
                          setRenamingProject(null)
                        }
                      }}
                      style={{
                        flex: 1, background: 'transparent', border: 'none', outline: 'none',
                        fontSize: 12.5, color: T.text, fontFamily: 'Inter, sans-serif',
                        minWidth: 0,
                      }}
                    />
                  ) : (
                    <span
                      onClick={() => router.push(`/workspace/project/${project.id}`)}
                      style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', cursor: 'pointer' }}
                    >
                      {project.name}
                    </span>
                  )}

                  {/* Save rename OR ··· menu trigger */}
                  {isRenamingThis ? (
                    <button
                      onClick={() => confirmRename(project.id)}
                      style={{
                        background: 'none', border: 'none', padding: 3,
                        cursor: 'pointer', color: '#22C55E',
                        display: 'flex', flexShrink: 0, borderRadius: 4,
                      }}
                      title="Save rename"
                    >
                      <Check size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={e => {
                        e.stopPropagation()
                        const rect = e.currentTarget.getBoundingClientRect()
                        setProjectMenu({ id: project.id, x: rect.right + 4, y: rect.top })
                      }}
                      style={{ background: 'none', border: 'none', padding: 3, cursor: 'pointer', color: T.textMuted, display: 'flex', flexShrink: 0, borderRadius: 4 }}
                    >
                      <MoreHorizontal size={13} />
                    </button>
                  )}
                </div>

                {/* Project artifacts (diagrams) */}
                {isExpanded && (
                  <div style={{ paddingLeft: 22 }}>
                    {diagrams.length === 0 && (
                      <div style={{ padding: '4px 10px 4px 14px', fontSize: 11, color: T.textMuted, fontFamily: 'Inter, sans-serif', fontStyle: 'italic' }}>
                        No artifacts yet
                      </div>
                    )}
                    {diagrams.map(d => {
                      const meta = TYPE_META[d.diagram_type] ?? { color: '#6366F1', short: '?' }
                      const isActive = isActiveDiagram(d)
                      return (
                        <Link
                          key={d.id}
                          href={diagramHref(d)}
                          className="sidebar-nav-link"
                          style={{ ...rowStyle(isActive, T), fontSize: 12, paddingRight: 10 }}
                        >
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, flexShrink: 0 }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {d.title || 'Untitled'}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* [+ New project] */}
          {!loadingProjects && (
            <div style={{ marginTop: 6 }}>
              {creatingProject ? (
                <div style={{ padding: '6px 10px', marginLeft: 4, marginRight: 4 }}>
                  {/* Color picker row */}
                  <div style={{ display: 'flex', gap: 4, marginBottom: 6, flexWrap: 'wrap', paddingLeft: 2 }}>
                    {PROJECT_COLORS.map(c => (
                      <button
                        key={c}
                        onClick={() => setNewProjectColor(c)}
                        style={{
                          width: 14, height: 14, borderRadius: '50%', background: c,
                          border: newProjectColor === c ? '2px solid white' : '2px solid transparent',
                          cursor: 'pointer', padding: 0,
                          boxShadow: newProjectColor === c ? `0 0 0 1px ${c}` : 'none',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 4 }}>
                    <input
                      ref={newProjectInputRef}
                      value={newProjectName}
                      onChange={e => { setNewProjectName(e.target.value); setCreateProjectError(null) }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') confirmCreateProject()
                        if (e.key === 'Escape') dismissCreateProject()
                      }}
                      placeholder="Project name"
                      disabled={savingProject}
                      style={{
                        flex: 1, padding: '5px 8px', borderRadius: 6,
                        border: `1px solid ${createProjectError ? '#EF4444' : T.divider}`,
                        background: isDark ? 'rgba(255,255,255,0.05)' : '#F7F7F8',
                        color: T.text, fontSize: 12, fontFamily: 'Inter, sans-serif',
                        outline: 'none',
                      }}
                    />
                    <button
                      onClick={confirmCreateProject}
                      disabled={savingProject || !newProjectName.trim()}
                      title="Create project"
                      style={{
                        background: 'none', border: 'none', cursor: savingProject || !newProjectName.trim() ? 'default' : 'pointer',
                        color: '#22C55E', display: 'flex', alignItems: 'center', opacity: savingProject || !newProjectName.trim() ? 0.4 : 1,
                      }}
                    >
                      {savingProject
                        ? <span style={{ width: 14, height: 14, border: '2px solid #22C55E', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.6s linear infinite' }} />
                        : <Check size={14} />}
                    </button>
                    <button
                      onClick={dismissCreateProject}
                      disabled={savingProject}
                      title="Cancel"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, display: 'flex', alignItems: 'center' }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {createProjectError && (
                    <p style={{ margin: '4px 0 0', fontSize: 11, color: '#EF4444', fontFamily: 'Inter, sans-serif' }}>
                      {createProjectError}
                    </p>
                  )}
                </div>
              ) : (
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={startCreatingProject}
                    style={{
                      ...rowStyle(false, T),
                      width: 'calc(100% - 8px)',
                      border: 'none',
                      color: T.textMuted,
                      fontSize: 12,
                    }}
                  >
                    <Plus size={12} style={{ flexShrink: 0 }} />
                    New project
                  </button>

                  {showNewProjectTooltip && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 'calc(100% + 10px)',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 220,
                        zIndex: 50,
                        background: isDark ? '#111113' : '#FFFFFF',
                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#E4E4E7'}`,
                        borderRadius: 10,
                        boxShadow: isDark ? '0 10px 28px rgba(0,0,0,0.45)' : '0 8px 24px rgba(0,0,0,0.12)',
                        padding: '10px 11px',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          left: -6,
                          top: '50%',
                          width: 12,
                          height: 12,
                          transform: 'translateY(-50%) rotate(45deg)',
                          background: isDark ? '#111113' : '#FFFFFF',
                          borderLeft: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#E4E4E7'}`,
                          borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#E4E4E7'}`,
                        }}
                      />
                      <div style={{ fontSize: 12, fontWeight: 700, color: isDark ? '#C4B5FD' : '#5B5BD6', marginBottom: 4 }}>
                        💡 Stay organized
                      </div>
                      <div style={{ fontSize: 11.5, lineHeight: 1.45, color: isDark ? '#A1A1AA' : '#52525B', marginBottom: 8 }}>
                        Create projects to group your diagrams by team, client, or topic.
                      </div>
                      <button
                        onClick={() => {
                          localStorage.setItem('flowmapr:new-project-tip-dismissed', 'true')
                          setShowNewProjectTooltip(false)
                          if (tooltipTimerRef.current) {
                            window.clearTimeout(tooltipTimerRef.current)
                            tooltipTimerRef.current = null
                          }
                        }}
                        style={{
                          border: 'none',
                          background: isDark ? 'rgba(99,102,241,0.18)' : 'rgba(91,91,214,0.1)',
                          color: isDark ? '#C4B5FD' : '#5B5BD6',
                          borderRadius: 7,
                          padding: '5px 9px',
                          fontSize: 11.5,
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        Got it ✓
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Contact support ───────────────────────────────────────────────── */}
        <div style={{ padding: '4px 10px', borderTop: `1px solid ${T.divider}`, flexShrink: 0 }}>
          <button
            onClick={handleContactSupport}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 10px',
              borderRadius: 8,
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: T.textMuted,
              fontSize: 12,
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              textAlign: 'left',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = T.text)}
            onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}
          >
            <MessageCircle size={13} style={{ flexShrink: 0 }} />
            Contact support
          </button>
        </div>

        {/* ── Suggest a feature ──────────────────────────────────────────────── */}
        <div style={{ padding: '4px 10px', borderTop: `1px solid ${T.divider}`, flexShrink: 0 }}>
          <a
            href="https://flowmapr.canny.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 10px', borderRadius: 8,
              color: T.textMuted, fontSize: 12,
              fontFamily: 'Inter, sans-serif', fontWeight: 500,
              textDecoration: 'none', transition: 'color 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = T.text)}
            onMouseLeave={e => (e.currentTarget.style.color = T.textMuted)}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flexShrink: 0 }}>
              <line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/>
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
            </svg>
            Suggest a feature
            <ArrowUpRight size={10} style={{ marginLeft: 'auto', opacity: 0.4, flexShrink: 0 }} />
          </a>
        </div>

        {/* ── Upgrade card ───────────────────────────────────────────────────── */}
        {plan === 'free' && (
          <div style={{ padding: '10px', borderTop: `1px solid ${T.divider}`, flexShrink: 0 }}>
            <div style={{
              padding: '14px',
              borderRadius: 10,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
              border: '1px solid rgba(99,102,241,0.2)',
            }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: T.upgradeTitle, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>
                Upgrade to Basic
              </p>
              <p style={{ fontSize: 11, color: T.upgradeDesc, fontFamily: 'Inter, sans-serif', lineHeight: 1.5, marginBottom: 10 }}>
                100 AI generations/month, API Lens, Version History & more
              </p>
              <Link href="/settings" style={{
                display: 'block', textAlign: 'center',
                padding: '7px', borderRadius: 7,
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                color: '#FFFFFF', fontSize: 12, fontWeight: 600,
                fontFamily: 'Inter, sans-serif', textDecoration: 'none',
              }}>
                Upgrade →
              </Link>
            </div>
          </div>
        )}

      </aside>

      {/* ── Project context menu (portal) ────────────────────────────────────── */}
      {projectMenu && (() => {
        const project = projects.find(p => p.id === projectMenu.id)
        if (!project) return null
        return (
          <div
            onMouseDown={e => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: projectMenu.y, left: projectMenu.x,
              zIndex: 2000,
              background: T.menuBg,
              border: `1px solid ${T.menuBorder}`,
              borderRadius: 10,
              boxShadow: T.menuShadow,
              minWidth: 180,
              padding: '6px 0',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            {/* Color swatches */}
            <div style={{ padding: '6px 12px 8px', borderBottom: `1px solid ${T.divider}` }}>
              <div style={{ fontSize: 10, fontWeight: 600, color: T.textMuted, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
                Color
              </div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {PROJECT_COLORS.map(c => (
                  <button
                    key={c}
                    onMouseDown={e => {
                      e.stopPropagation()
                      handleColorChange(project.id, c)
                    }}
                    style={{
                      width: 18, height: 18, borderRadius: '50%', background: c,
                      border: project.color === c ? '2px solid white' : '2px solid transparent',
                      cursor: 'pointer', padding: 0,
                      boxShadow: project.color === c ? `0 0 0 1.5px ${c}` : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Rename */}
            <button
              onMouseDown={e => {
                e.stopPropagation()
                startRenaming(project.id, project.name)
              }}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 14px',
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, color: T.text, display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Pencil size={13} /> Rename
            </button>

            {/* Delete (disabled for default) */}
            {!project.is_default && (
              <button
                onMouseDown={e => {
                  e.stopPropagation()
                  handleDeleteProject(project.id)
                }}
                style={{
                  width: '100%', textAlign: 'left', padding: '8px 14px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 13, color: '#EF4444', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                <Trash2 size={13} /> Delete project
              </button>
            )}
          </div>
        )
      })()}

      {/* ── New Artifact modal ───────────────────────────────────────────────── */}
      <NewArtifactModal
        open={newArtifactOpen}
        onClose={() => setNewArtifactOpen(false)}
        onNewDiagram={handleNewDiagram}
        blockDiagramGeneration={freeLimitReached}
        onBlockedDiagramGeneration={() => setGenerationLimitModalOpen(true)}
      />

      {/* ── Fallback GenerateDialog (when no onNewDiagram prop) ──────────────── */}
      <GenerateDialog open={generateOpen} onOpenChange={setGenerateOpen} />

      <GenerationLimitUpgradeModal
        open={generationLimitModalOpen}
        onOpenChange={setGenerationLimitModalOpen}
        currentPlanLabel="Free"
      />

      <style>{`
        .sidebar-nav-link:hover {
          background: ${isDark ? 'rgba(255,255,255,0.04)' : '#F0F0F2'} !important;
          color: ${isDark ? '#E4E4E7' : '#0F0F13'} !important;
        }
        [data-theme="light"] .sidebar-nav-link:hover {
          background: rgba(0,0,0,0.04) !important;
          color: #111827 !important;
        }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </>
  )
}
