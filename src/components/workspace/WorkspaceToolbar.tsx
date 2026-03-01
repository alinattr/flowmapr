'use client'

import { Search, Grid3X3, List, ChevronDown } from 'lucide-react'

export type SortOption = 'updated_desc' | 'updated_asc' | 'created_desc' | 'name_asc'
export type ViewMode = 'grid' | 'list'

interface WorkspaceToolbarProps {
  search: string
  sort: SortOption
  view: ViewMode
  onSearch: (v: string) => void
  onSort: (v: SortOption) => void
  onView: (v: ViewMode) => void
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'updated_desc', label: 'Last modified' },
  { value: 'updated_asc', label: 'Oldest modified' },
  { value: 'created_desc', label: 'Newest created' },
  { value: 'name_asc', label: 'Name A→Z' },
]

export function WorkspaceToolbar({ search, sort, view, onSearch, onSort, onView }: WorkspaceToolbarProps) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10, padding: '0 0 16px',
      flexWrap: 'wrap',
    }}>
      {/* Search */}
      <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
        <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#52525B', pointerEvents: 'none' }} />
        <input
          value={search}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search diagrams…"
          style={{
            width: '100%', padding: '7px 10px 7px 32px',
            borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--color-text-primary, #E4E4E7)',
            fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Sort */}
      <div style={{ position: 'relative' }}>
        <select
          value={sort}
          onChange={e => onSort(e.target.value as SortOption)}
          style={{
            padding: '7px 28px 7px 10px',
            borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.04)',
            color: 'var(--color-text-secondary, #94A3B8)',
            fontSize: 13, fontFamily: 'Inter, sans-serif', outline: 'none',
            appearance: 'none', cursor: 'pointer',
          }}
        >
          {SORT_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <ChevronDown size={12} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', color: '#52525B', pointerEvents: 'none' }} />
      </div>

      {/* View toggle */}
      <div style={{
        display: 'flex', borderRadius: 8,
        border: '1px solid rgba(255,255,255,0.08)',
        overflow: 'hidden',
      }}>
        {(['grid', 'list'] as ViewMode[]).map(v => (
          <button
            key={v}
            onClick={() => onView(v)}
            style={{
              padding: '7px 10px', border: 'none', cursor: 'pointer',
              background: view === v ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
              color: view === v ? '#A78BFA' : '#52525B',
              transition: 'all 0.15s',
            }}
          >
            {v === 'grid' ? <Grid3X3 size={14} /> : <List size={14} />}
          </button>
        ))}
      </div>
    </div>
  )
}
