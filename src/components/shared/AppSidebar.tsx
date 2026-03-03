'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowUpRight, Plus, ChevronDown, MoreHorizontal, Pencil, Trash2, Check, X } from 'lucide-react'
import { useTheme } from '@/lib/theme/ThemeProvider'
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

// ─── Theme-aware color tokens ─────────────────────────────────────────────────
function useTokens(isDark: boolean) {
  return {
    // Text
    navDefault:       isDark ? 'rgba(161,161,170,0.8)' : '#374151',
    navActive:        isDark ? '#C4B5FD'               : '#111827',
    navMuted:         isDark ? 'rgba(113,113,122,0.9)' : '#6B7280',
    navMutedStrong:   isDark ? 'rgba(113,113,122,0.7)' : '#9CA3AF',
    sectionLabel:     isDark ? '#52525B'               : '#6B7280',
    suggestDefault:   isDark ? '#52525B'               : '#6B7280',
    suggestHover:     isDark ? '#94A3B8'               : '#111827',
    upgradeDesc:      isDark ? '#71717A'               : '#6B7280',
    upgradeTitle:     isDark ? '#C4B5FD'               : '#4F46E5',
    renameText:       isDark ? '#A1A1AA'               : '#374151',
    // Backgrounds
    navActiveBg:      isDark ? 'rgba(99,102,241,0.10)' : 'rgba(0,0,0,0.06)',
    badgeBg:          isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    // Divider
    divider:          isDark
      ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)'
      : 'linear-gradient(90deg, transparent, rgba(0,0,0,0.08), transparent)',
    // Borders
    borderTop:        isDark ? '1px solid rgba(255,255,255,0.04)' : '1px solid rgba(0,0,0,0.07)',
    // Dev-tools icons (inactive)
    iconInactive:     isDark ? 'rgba(113,113,122,0.7)' : '#9CA3AF',
    // "New" badge on Code Lens
    newBadgeColor:    isDark ? '#A78BFA'               : '#4F46E5',
    newBadgeBg:       isDark ? 'rgba(167,139,250,0.12)' : 'rgba(99,102,241,0.10)',
    newBadgeBorder:   isDark ? 'rgba(167,139,250,0.25)' : 'rgba(99,102,241,0.25)',
    // Folder context menu
    menuBg:           isDark ? '#18181B'               : '#FFFFFF',
    menuBorder:       isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.12)',
    menuShadow:       isDark ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.12)',
  }
}

function navItemStyle(isActive: boolean, T: ReturnType<typeof useTokens>): React.CSSProperties {
  return {
    display: 'flex', alignItems: 'center', gap: 9,
    padding: '7px 10px', marginLeft: 6, marginRight: 6,
    borderRadius: 8, cursor: 'pointer',
    fontSize: 13, fontFamily: 'Inter, sans-serif',
    fontWeight: isActive ? 500 : 400, textDecoration: 'none',
    color: isActive ? T.navActive : T.navDefault,
    background: isActive ? T.navActiveBg : 'transparent',
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
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const T = useTokens(isDark)

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
            fontWeight: 500, color: T.navDefault,
            transition: 'all 0.15s ease', userSelect: 'none',
          }}
          className="sidebar-nav-link"
        >
          <span style={{
            display: 'flex', alignItems: 'center',
            color: T.navMutedStrong,
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
            fontSize: 10, color: T.navMutedStrong,
            background: T.badgeBg,
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
                    color: isActive ? T.navActive : T.navMuted,
                    background: isActive ? T.navActiveBg : 'transparent',
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
        <div style={{ margin: '8px 14px 4px', height: 1, background: T.divider }} />
        <div style={{ padding: '4px 10px 2px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: T.sectionLabel, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Folders
          </span>
          <button
            onClick={() => setCreatingFolder(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sectionLabel, padding: 2, borderRadius: 3 }}
            title="New folder"
          >
            <Plus size={12} />
          </button>
        </div>

        {/* All diagrams link (no folder filter) */}
        <button
          onClick={() => onFolderSelect?.(null)}
          style={{
            ...navItemStyle(activeFolder === null && pathname === '/workspace', T),
            borderTop: 'none', borderRight: 'none', borderBottom: 'none',
            background: activeFolder === null && pathname === '/workspace' ? T.navActiveBg : 'transparent',
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
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: isDark ? '#C4B5FD' : '#4F46E5', fontFamily: 'Inter, sans-serif' }}
                  />
                  <button onClick={() => { onFolderRename?.(f.id, renameDraft.trim() || f.name); setRenamingId(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22C55E', padding: 1 }}><Check size={11} /></button>
                  <button onClick={() => setRenamingId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A', padding: 1 }}><X size={11} /></button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                  <button
                    onClick={() => onFolderSelect?.(f.id)}
                    style={{
                      ...navItemStyle(isActive, T),
                      borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                      flex: 1, textAlign: 'left',
                      background: isActive ? T.navActiveBg : 'transparent',
                    }}
                    className="sidebar-nav-link"
                  >
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: f.color, flexShrink: 0 }} />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{f.name}</span>
                    {count > 0 && <span style={{ fontSize: 10, color: T.sectionLabel, background: T.badgeBg, borderRadius: 10, padding: '1px 5px' }}>{count}</span>}
                  </button>
                  <button
                    onClick={e => { e.stopPropagation(); setFolderMenuId(folderMenuId === f.id ? null : f.id) }}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.sectionLabel, padding: '6px 8px', opacity: 0, transition: 'opacity 0.15s' }}
                    className="folder-menu-btn"
                  >
                    <MoreHorizontal size={12} />
                  </button>
                </div>
              )}

              {folderMenuId === f.id && (
                <div style={{
                  position: 'absolute', right: 4, top: '100%', zIndex: 50,
                  background: T.menuBg, border: `1px solid ${T.menuBorder}`,
                  borderRadius: 8, padding: 6, minWidth: 160,
                  boxShadow: T.menuShadow,
                }}
                  onClick={e => e.stopPropagation()}
                >
                  {/* Color swatches */}
                  <div style={{ display: 'flex', gap: 6, padding: '4px 6px 8px' }}>
                    {FOLDER_COLORS.map(c => (
                      <button key={c} onClick={() => { onFolderColor?.(f.id, c); setFolderMenuId(null) }}
                        style={{ width: 16, height: 16, borderRadius: '50%', background: c, border: `2px solid ${f.color === c ? (isDark ? '#fff' : '#111') : 'transparent'}`, cursor: 'pointer' }} />
                    ))}
                  </div>
                  <button
                    onClick={() => { setRenameDraft(f.name); setRenamingId(f.id); setFolderMenuId(null) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '6px 8px', background: 'none', border: 'none', cursor: 'pointer', color: T.renameText, fontSize: 12, fontFamily: 'Inter, sans-serif', borderRadius: 4 }}
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
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 12, color: isDark ? '#C4B5FD' : '#4F46E5', fontFamily: 'Inter, sans-serif' }}
            />
            <button onClick={submitNewFolder} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#22C55E', padding: 1 }}><Check size={12} /></button>
            <button onClick={() => setCreatingFolder(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717A', padding: 1 }}><X size={12} /></button>
          </div>
        )}
      </div>

      {/* Developer Tools section */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ margin: '8px 14px 4px', height: 1, background: T.divider }} />
        <div style={{ padding: '4px 10px 4px 16px' }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: T.sectionLabel, fontFamily: 'Inter, sans-serif', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Developer Tools
          </span>
        </div>

        {/* API Lens */}
        <Link
          href="/workspace/api-lens"
          style={{
            ...navItemStyle(pathname === '/workspace/api-lens' || pathname.startsWith('/workspace/api-lens/'), T),
            display: 'flex', alignItems: 'center', gap: 9,
          }}
          className="sidebar-nav-link"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, color: pathname === '/workspace/api-lens' ? '#06B6D4' : T.iconInactive }}>
            <path d="M12 2L2 7l10 5 10-5-10-5z"/>
            <path d="M2 17l10 5 10-5"/>
            <path d="M2 12l10 5 10-5"/>
          </svg>
          <span>API Lens</span>
        </Link>

        {/* Code Lens */}
        <Link
          href="/workspace/code-lens"
          style={{
            ...navItemStyle(pathname === '/workspace/code-lens', T),
            display: 'flex', alignItems: 'center', gap: 9,
          }}
          className="sidebar-nav-link"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            style={{ flexShrink: 0, color: pathname === '/workspace/code-lens' ? '#A78BFA' : T.iconInactive }}>
            <polyline points="16 18 22 12 16 6"/>
            <polyline points="8 6 2 12 8 18"/>
          </svg>
          <span style={{ flex: 1 }}>Code Lens</span>
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: T.newBadgeColor,
            background: T.newBadgeBg,
            border: `1px solid ${T.newBadgeBorder}`,
            padding: '1px 5px', borderRadius: 6,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            New
          </span>
        </Link>

        {/* Explain Image */}
        <Link
          href="/workspace/explain-image"
          style={{
            ...navItemStyle(pathname === '/workspace/explain-image', T),
            display: 'flex', alignItems: 'center', gap: 9,
          }}
          className="sidebar-nav-link"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"
            style={{ flexShrink: 0, color: pathname === '/workspace/explain-image' ? '#818CF8' : T.iconInactive }}>
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span style={{ flex: 1 }}>Explain Image</span>
          <span style={{
            fontSize: 9, fontWeight: 700,
            color: T.newBadgeColor,
            background: T.newBadgeBg,
            border: `1px solid ${T.newBadgeBorder}`,
            padding: '1px 5px', borderRadius: 6,
            letterSpacing: '0.04em', textTransform: 'uppercase',
          }}>
            New
          </span>
        </Link>
      </div>

      {/* Suggest a feature */}
      <div style={{ padding: '4px 10px', borderTop: T.borderTop, flexShrink: 0 }}>
        <a
          href="https://flowmapr.canny.io"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 10px', borderRadius: 8,
            color: T.suggestDefault, fontSize: 12,
            fontFamily: 'Inter, sans-serif', fontWeight: 500,
            textDecoration: 'none', transition: 'color 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = T.suggestHover)}
          onMouseLeave={e => (e.currentTarget.style.color = T.suggestDefault)}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <line x1="9" y1="18" x2="15" y2="18"/>
            <line x1="10" y1="22" x2="14" y2="22"/>
            <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>
          </svg>
          Suggest a feature
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto', opacity: 0.4, flexShrink: 0 }}>
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>

      {/* Upgrade card */}
      {(plan === 'free_trial' || plan === 'free') && (
        <div style={{ padding: '10px', borderTop: T.borderTop, flexShrink: 0 }}>
          <div style={{
            padding: '14px', borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
            border: '1px solid rgba(99,102,241,0.2)',
          }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: T.upgradeTitle, fontFamily: 'Inter, sans-serif', marginBottom: 4 }}>
              Upgrade to Basic
            </p>
            <p style={{ fontSize: 11, color: T.upgradeDesc, fontFamily: 'Inter, sans-serif', lineHeight: 1.4 }}>
              100 AI generations/month, API Lens, Code Lens & more
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
