'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Plus, ChevronDown, Folder, FolderOpen, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react'
import type { DiagramSummary, Folder as FolderType } from '@/types/diagram'

const TYPE_COLORS: Record<string, string> = {
  bpmn: '#6366F1',
  uml_sequence: '#22C55E',
  erd: '#3B82F6',
  flowchart: '#F59E0B',
  c4_l1: '#A78BFA',
  c4_l2: '#8B5CF6',
  api_lens: '#06B6D4',
}

const FOLDER_COLORS = ['#6366F1', '#22C55E', '#3B82F6', '#F59E0B', '#EC4899', '#14B8A6']

function navItemStyle(isActive: boolean): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '7px 10px', marginLeft: 6, marginRight: 6,
    borderRadius: 8, cursor: 'pointer',
    fontSize: 13, fontFamily: 'Inter, sans-serif',
    fontWeight: isActive ? 500 : 400, textDecoration: 'none',
    color: isActive ? '#C4B5FD' : 'rgba(161,161,170,0.8)',
    background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
    borderLeft: isActive ? '2px solid rgba(99,102,241,0.6)' : '2px solid transparent',
    paddingLeft: isActive ? 8 : 10,
    transition: 'all 0.15s ease',
  }
}

interface AppSidebarProps {
  plan: string
  diagrams?: DiagramSummary[]
  folders?: FolderType[]
  activeFolder?: string | null
  onNewDiagram?: () => void
  onFolderSelect?: (id: string | null) => void
  onFolderCreate?: (name: string) => void
  onFolderDelete?: (id: string) => void
  onFolderRename?: (id: string, name: string) => void
  onFolderColor?: (id: string, color: string) => void
}

export function AppSidebar({
  plan, diagrams = [], folders = [], activeFolder = null,
  onNewDiagram, onFolderSelect, onFolderCreate, onFolderDelete, onFolderRename, onFolderColor,
}: AppSidebarProps) {
  const pathname = usePathname()
  const [creatingFolder, setCreatingFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [folderMenuId, setFolderMenuId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameDraft, setRenameDraft] = useState('')
  const [diagramsOpen, setDiagramsOpen] = useState(true)

  function submitNewFolder() {
    const name = newFolderName.trim()
    if (name) onFolderCreate?.(name)
    setNewFolderName('')
    setCreatingFolder(false)
  }

  return (
    <aside className="app-sidebar" style={{
      width: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
      height: '100%', overflow: 'hidden',
      background: 'rgba(9,9,11,0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255,255,255,0.06)',
      position: 'relative',
    }}>
      {/* New diagram button */}
      <div style={{ padding: '12px 10px 8px', flexShrink: 0 }}>
        <button
          onClick={onNewDiagram}
          style={{
            width: '100%', justifyContent: 'center',
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
          <Plus size={15} strokeWidth={2.5} />
          New diagram
        </button>
      </div>

      {/* Scrollable nav area */}
      <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
        {/* My diagrams — collapsible */}
        <div
          onClick={() => setDiagramsOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 10px', margin: '4px 6px 2px',
            borderRadius: 8, cursor: 'pointer',
            fontSize: 13, fontFamily: 'Inter, sans-serif',
            fontWeight: 500, color: 'rgba(161,161,170,0.9)',
            transition: 'all 0.15s ease', userSelect: 'none',
          }}
          className="sidebar-nav-link"
        >
          <span style={{
            display: 'flex', alignItems: 'center',
            color: 'rgba(113,113,122,0.7)',
            transition: 'transform 0.2s ease',
            transform: diagramsOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
          }}>
            <ChevronDown size={13} />
          </span>
          <Link href="/workspace" onClick={e => e.stopPropagation()} style={{
            flex: 1, textDecoration: 'none', color: 'inherit',
          }}>
            My diagrams
          </Link>
          <span style={{
            fontSize: 10, color: 'rgba(113,113,122,0.7)',
            background: 'rgba(255,255,255,0.06)',
            padding: '1px 5px', borderRadius: 8, fontWeight: 500,
          }}>
            {diagrams.length}
          </span>
        </div>

        {diagramsOpen && (
          <div style={{ animation: 'slideDown 0.15s ease' }}>
            {diagrams.slice(0, 8).map(d => {
              const dPath = d.diagram_type === 'api_lens'
                ? `/api-lens/${d.id}`
                : d.diagram_type === 'uml_sequence'
                  ? `/sequence/${d.id}`
                  : `/diagram/${d.id}`
              const isActive = pathname === dPath
              const dotColor = TYPE_COLORS[d.diagram_type] ?? '#52525B'
              return (
                <Link
                  key={d.id}
                  href={dPath}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '5px 10px 5px 28px',
                    margin: '1px 6px', borderRadius: 6,
                    textDecoration: 'none', fontSize: 12,
                    fontFamily: 'Inter, sans-serif', fontWeight: 400,
                    color: isActive ? '#C4B5FD' : 'rgba(113,113,122,0.9)',
                    background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                    borderLeft: isActive ? '2px solid rgba(99,102,241,0.5)' : '2px solid transparent',
                    paddingLeft: isActive ? 26 : 28,
                    transition: 'all 0.12s ease', overflow: 'hidden',
                  }}
                  className="sidebar-nav-link"
                >
                  <span style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: dotColor, flexShrink: 0,
                    boxShadow: isActive ? `0 0 4px ${dotColor}` : 'none',
                  }} />
                  <span style={{
                    flex: 1, overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {d.title ?? 'Untitled'}
                  </span>
                </Link>
              )
            })}
            {diagrams.length > 8 && (
              <Link
                href="/workspace"
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '4px 10px 4px 28px', margin: '1px 6px',
                  borderRadius: 6, textDecoration: 'none',
                  fontSize: 11, fontFamily: 'Inter, sans-serif',
                  color: 'rgba(99,102,241,0.7)',
                  transition: 'color 0.15s ease',
                }}
                className="sidebar-nav-link"
              >
                +{diagrams.length - 8} more diagrams →
              </Link>
            )}
          </div>
        )}

        {/* Folders section */}
        <div style={{ margin: '8px 14px 4px', height: 1, background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }} />
        <div style={{ padding: '4px 10px 2px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: '#52525B', fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Folders
          </span>
          <button
            onClick={() => setCreatingFolder(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525B', padding: 2, borderRadius: 3 }}
            title="New folder"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* All diagrams link (no folder filter) */}
        <button
          onClick={() => onFolderSelect?.(null)}
          style={{
            ...navItemStyle(activeFolder === null && pathname === '/workspace'),
            borderTop: 'none', borderRight: 'none', borderBottom: 'none',
            background: activeFolder === null && pathname === '/workspace' ? 'rgba(99,102,241,0.1)' : 'transparent',
            width: '100%', textAlign: 'left',
          }}
          className="sidebar-nav-link"
        >
          <span style={{ fontSize: 13 }}>📋</span>
          <span>All diagrams</span>
        </button>

        {/* Folder list */}
        {folders.map(f => {
          const isActive = activeFolder === f.id
          const count = diagrams.filter(d => d.folder_id === f.id).length
          return (
            <div key={f.id} style={{ position: 'relative' }}>
              {renamingId === f.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '2px 6px', padding: '5px 8px', background: 'rgba(99,102,241,0.08)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)' }}>
                  <input
                    autoFocus
                    value={renameDraft}
                    onChange={e => setRenameDraft(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') { onFolderRename?.(f.id, renameDraft.trim() || f.name); setRenamingId(null) }
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#C4B5FD', fontFamily: 'Inter, sans-serif' }}
                  />
                  <button onClick={() => { onFolderRename?.(f.id, renameDraft.trim() || f.name); setRenamingId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22C55E', padding: 1 }}><Check size={11} /></button>
                  <button onClick={() => setRenamingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A', padding: 1 }}><X size={11} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <button
                    onClick={() => onFolderSelect?.(f.id)}
                    style={{
                      ...navItemStyle(isActive),
                      borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                      flex: 1, textAlign: 'left',
                      background: isActive ? 'rgba(99,102,241,0.1)' : 'transparent',
                    }}
                    className="sidebar-nav-link"
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.name}</span>
                    {count > 0 && <span style={{ fontSize: 10, color: '#52525B', background: 'rgba(255,255,255,0.06)', borderRadius: 10, padding: '1px 5px' }}>{count}</span>}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setFolderMenuId(folderMenuId === f.id ? null : f.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525B', padding: '6px 8px', opacity: 0, transition: 'opacity 0.15s' }}
                    className="folder-menu-btn"
                  >
                    <MoreHorizontal size={12} />
                  </button>
                </div>
              )}

              {folderMenuId === f.id && (
                <div style={{
                  position: 'absolute', right: 4, top: '100%', zIndex: 50,
                  background: '#18181B', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8, padding: 6, minWidth: 160,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Color swatches */}
                  <div style={{ display: 'flex', gap: 6, padding: '4px 6px 8px' }}>
                    {FOLDER_COLORS.map(c => (
                      <button key={c} onClick={() => { onFolderColor?.(f.id, c); setFolderMenuId(null) }}
                        style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: `2px solid ${f.color === c ? '#fff' : 'transparent'}`, cursor: 'pointer' }} />
                    ))}
                  </div>
                  <button
                    onClick={() => { setRenameDraft(f.name); setRenamingId(f.id); setFolderMenuId(null) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer', color: '#A1A1AA', fontSize: 12, fontFamily: 'Inter, sans-serif', borderRadius: 4 }}
                  >
                    <Pencil size={11} /> Rename
                  </button>
                  <button
                    onClick={() => { onFolderDelete?.(f.id); setFolderMenuId(null) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: 12, fontFamily: 'Inter, sans-serif', borderRadius: 4 }}
                  >
                    <Trash2 size={11} /> Delete
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {/* New folder input */}
        {creatingFolder && (
          <div style={{ margin: '4px 6px', padding: '6px 10px', background: 'rgba(99,102,241,0.06)', borderRadius: 8, border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              autoFocus
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Folder name…"
              onKeyDown={e => { if (e.key === 'Enter') submitNewFolder(); if (e.key === 'Escape') setCreatingFolder(false) }}
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: '#C4B5FD', fontFamily: 'Inter, sans-serif' }}
            />
            <button onClick={submitNewFolder} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22C55E', padding: 1 }}><Check size={12} /></button>
            <button onClick={() => setCreatingFolder(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A', padding: 1 }}><X size={12} /></button>
          </div>
        )}
      </div>

      {/* Upgrade card */}
      {(plan === 'free_trial' || plan === 'free') && (
        <div style={{ padding: '10px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div style={{
            padding: '14px', borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
            border: '1px solid rgba(99,102,241,0.2)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: '#C4B5FD', fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>
              Upgrade to Basic
            </p>
            <p style={{ fontSize: 11, color: '#71717A', fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
              100 AI generations/month, API Lens & more
            </p>
            <Link href="/settings?tab=billing" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
              marginTop: 10, padding: '7px 0', borderRadius: 7,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))',
              border: '1px solid rgba(99,102,241,0.4)',
              fontSize: 12, fontWeight: 600, color: '#A78BFA',
              textDecoration: 'none', fontFamily: 'Inter, sans-serif',
            }}>
              Upgrade <ArrowUpRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </aside>
  )
}
