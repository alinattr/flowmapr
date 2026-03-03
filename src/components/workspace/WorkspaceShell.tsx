'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { AppNavbar } from '@/components/shared/AppNavbar'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { GenerateDialog } from '@/components/workspace/GenerateDialog'
import { WorkspaceToolbar, type SortOption, type ViewMode } from '@/components/workspace/WorkspaceToolbar'
import { Button } from '@/components/ui/button'
import { GitBranch, Sparkles, FileText, MoreHorizontal, Trash2, FolderInput } from 'lucide-react'
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
import type { DiagramSummary, Folder } from '@/types/diagram'
import { moveDiagramToFolder, createFolder, getFolders, deleteFolder, renameFolder, updateFolderColor } from '@/lib/folders/folderService'
import { OnboardingModal } from '@/components/onboarding/OnboardingModal'

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

interface WorkspaceShellProps {
  email: string
  fullName: string | null
  generationsRemaining: number
  plan: string
  diagrams: DiagramSummary[]
  folders: Folder[]
  needsOnboarding?: boolean
}

export function WorkspaceShell({
  email,
  fullName,
  generationsRemaining,
  plan,
  diagrams: initialDiagrams,
  folders: initialFolders,
  needsOnboarding = false,
}: WorkspaceShellProps) {
  const [generateOpen, setGenerateOpen] = useState(false)
  const [diagrams, setDiagrams] = useState(initialDiagrams)
  const [folders, setFolders] = useState(initialFolders)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (!needsOnboarding) return
    const t = setTimeout(() => setShowOnboarding(true), 600)
    return () => clearTimeout(t)
  }, [needsOnboarding])
  const [activeFolder, setActiveFolder] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('updated_desc')
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window !== 'undefined') return (localStorage.getItem('ws-view') as ViewMode) ?? 'grid'
    return 'grid'
  })

  useEffect(() => { localStorage.setItem('ws-view', view) }, [view])

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

  async function handleMove(diagramId: string, folderId: string | null) {
    const ok = await moveDiagramToFolder(diagramId, folderId)
    if (!ok) { toast.error('Failed to move'); return }
    setDiagrams(prev => prev.map(d => d.id === diagramId ? { ...d, folder_id: folderId } : d))
    toast.success(folderId ? 'Moved to folder' : 'Removed from folder')
  }

  async function handleCreateFolder(name: string) {
    const folder = await createFolder(name)
    if (folder) setFolders(prev => [...prev, folder])
  }

  async function handleDeleteFolder(id: string) {
    const ok = await deleteFolder(id)
    if (ok) {
      setFolders(prev => prev.filter(f => f.id !== id))
      setDiagrams(prev => prev.map(d => d.folder_id === id ? { ...d, folder_id: null } : d))
      if (activeFolder === id) setActiveFolder(null)
    }
  }

  async function handleRenameFolder(id: string, name: string) {
    const ok = await renameFolder(id, name)
    if (ok) setFolders(prev => prev.map(f => f.id === id ? { ...f, name } : f))
  }

  async function handleFolderColor(id: string, color: string) {
    const ok = await updateFolderColor(id, color)
    if (ok) setFolders(prev => prev.map(f => f.id === id ? { ...f, color } : f))
  }

  const filtered = useMemo(() => {
    let d = [...diagrams]
    if (activeFolder !== null) d = d.filter(x => x.folder_id === activeFolder)
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
  }, [diagrams, search, sort, activeFolder])

  const folderForActive = activeFolder ? folders.find(f => f.id === activeFolder) : null

  function DiagramCard({ d }: { d: DiagramSummary }) {
    return (
      <div className="diagram-card group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow hover:shadow-md"
        style={{ overflow: 'hidden' }}>
        <Link href={diagramPath(d)} className="block">
          {/* Preview */}
          <div style={{
            height: 160,
            background: 'var(--color-surface-raised)',
            position: 'relative',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', borderBottom: '1px solid var(--color-border)',
            borderRadius: '8px 8px 0 0',
            padding: 12,
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
            {/* Hover overlay */}
            <div className="thumbnail-overlay">
              <span className="thumbnail-overlay-label">Open →</span>
            </div>
          </div>
          <div style={{ padding: '12px 14px' }}>
            <p className="truncate text-[var(--color-text-primary)]" style={{ fontSize: 14, fontWeight: 600 }}>{d.title}</p>
            <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              {(() => { const s = getTypeStyle(d.diagram_type); return (
                <span style={{
                  padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, fontFamily: 'Inter, sans-serif',
                  background: s.bg, color: s.color,
                }}>
                  {s.label}
                </span>
              ) })()}
              <span style={{ fontSize: 12, color: '#6B7280' }}>{formatDate(d.updated_at)}</span>
            </div>
          </div>
        </Link>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-[var(--color-surface-raised)] group-hover:opacity-100">
              <MoreHorizontal className="h-4 w-4 text-[var(--color-text-secondary)]" strokeWidth={1.5} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <FolderInput className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Move to folder
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => handleMove(d.id, null)}>
                  — No folder
                </DropdownMenuItem>
                {folders.map(f => (
                  <DropdownMenuItem key={f.id} onClick={() => handleMove(d.id, f.id)}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, display: 'inline-block', marginRight: 8 }} />
                    {f.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
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

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      <AppNavbar email={email} fullName={fullName} generationsRemaining={generationsRemaining} />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          plan={plan}
          diagrams={diagrams}
          folders={folders}
          activeFolder={activeFolder}
          onNewDiagram={() => setGenerateOpen(true)}
          onFolderSelect={setActiveFolder}
          onFolderCreate={handleCreateFolder}
          onFolderDelete={handleDeleteFolder}
          onFolderRename={handleRenameFolder}
          onFolderColor={handleFolderColor}
        />
        <main className="flex flex-1 flex-col overflow-auto">
          <div className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {folderForActive ? folderForActive.name : 'My diagrams'}
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

            <WorkspaceToolbar
              search={search} sort={sort} view={view}
              onSearch={setSearch} onSort={setSort} onView={setView}
            />

            {filtered.length === 0 && search.trim() ? (
              <div className="flex flex-col items-center text-center pt-20" style={{ color: 'var(--color-text-secondary)' }}>
                <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
                <p style={{ fontSize: 14, fontFamily: 'Inter, sans-serif' }}>No diagrams match &ldquo;{search}&rdquo;</p>
                <button onClick={() => setSearch('')} style={{ marginTop: 8, fontSize: 13, color: '#A78BFA', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Clear search
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-1 items-center justify-center pt-20">
                <div className="flex max-w-sm flex-col items-center text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-subtle)]">
                    <GitBranch className="h-8 w-8 text-[var(--color-accent-brand)]" strokeWidth={1.5} />
                  </div>
                  <h1 className="mt-6 text-xl font-semibold text-[var(--color-text-primary)]">
                    {folderForActive ? 'This folder is empty' : 'Create your first diagram'}
                  </h1>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                    {folderForActive
                      ? 'Move diagrams here using the ··· menu on any diagram card.'
                      : `You have ${generationsRemaining} generations remaining. Describe any process and get a diagram in seconds.`
                    }
                  </p>
                  {!folderForActive && (
                    <Button className="mt-6 gap-2" size="default" onClick={() => setGenerateOpen(true)}>
                      <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                      Generate a diagram
                    </Button>
                  )}
                </div>
              </div>
            ) : view === 'grid' ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {filtered.map(d => <DiagramCard key={d.id} d={d} />)}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {filtered.map(d => {
                  const dotColor = TYPE_COLORS[d.diagram_type] ?? '#71717A'
                  const badge = getTypeStyle(d.diagram_type)
                  const folderName = d.folder_id ? folders.find(f => f.id === d.folder_id)?.name : null
                  return (
                    <div key={d.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)',
                      background: 'rgba(255,255,255,0.02)', transition: 'background 0.15s',
                    }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)' }}
                    >
                      <Link href={diagramPath(d)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontFamily: 'Inter, sans-serif', color: 'var(--color-text-primary)', fontWeight: 500, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {d.title}
                        </span>
                        <span style={{ padding: '2px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: badge.bg, color: badge.color, flexShrink: 0 }}>
                          {badge.label}
                        </span>
                        {folderName && (
                          <span style={{ fontSize: 11, color: '#52525B', flexShrink: 0 }}>📁 {folderName}</span>
                        )}
                        <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', flexShrink: 0 }}>{formatDate(d.updated_at)}</span>
                      </Link>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)', padding: 4, borderRadius: 4 }}>
                            <MoreHorizontal size={14} strokeWidth={1.5} />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuSub>
                            <DropdownMenuSubTrigger>
                              <FolderInput className="mr-2 h-4 w-4" strokeWidth={1.5} />Move to folder
                            </DropdownMenuSubTrigger>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem onClick={() => handleMove(d.id, null)}>— No folder</DropdownMenuItem>
                              {folders.map(f => (
                                <DropdownMenuItem key={f.id} onClick={() => handleMove(d.id, f.id)}>
                                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: f.color, display: 'inline-block', marginRight: 8 }} />
                                  {f.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuSubContent>
                          </DropdownMenuSub>
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
