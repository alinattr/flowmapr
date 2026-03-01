'use client'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '@/lib/theme/ThemeProvider'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      title={theme === 'light' ? 'Switch to dark' : 'Switch to light'}
      style={{
        width: 34, height: 34,
        borderRadius: 8,
        border: '1px solid var(--color-border)',
        background: 'var(--color-surface-raised)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: 'var(--color-text-secondary)',
        transition: 'all 0.2s ease',
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
        e.currentTarget.style.color = '#A78BFA'
        e.currentTarget.style.background = 'rgba(99,102,241,0.08)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--color-border)'
        e.currentTarget.style.color = 'var(--color-text-secondary)'
        e.currentTarget.style.background = 'var(--color-surface-raised)'
      }}
    >
      {theme === 'light' ? <Moon size={15} strokeWidth={1.5} /> : <Sun size={15} strokeWidth={1.5} />}
    </button>
  )
}
