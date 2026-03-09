'use client'

import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { useActiveProject } from '@/lib/context/active-project-context'

interface NewArtifactModalProps {
  open: boolean
  onClose: () => void
  /** Called when user picks "Generate diagram" — caller opens the diagram generation flow */
  onNewDiagram?: () => void
  /** Prevent opening generate flow when user has no free generations left */
  blockDiagramGeneration?: boolean
  /** Called when diagram generation is blocked and upgrade prompt should open */
  onBlockedDiagramGeneration?: () => void
}

const ARTIFACT_OPTIONS = [
  {
    id: 'diagram',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/>
        <rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/>
        <path d="M14 17.5h7M17.5 14v7"/>
      </svg>
    ),
    color: '#6366F1',
    label: 'Generate Diagram',
    desc: 'BPMN, ERD, Flowchart, C4, UML Sequence',
  },
  {
    id: 'api_lens',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
    ),
    color: '#06B6D4',
    label: 'API Lens',
    desc: 'Visualize API structure from spec or description',
    href: '/workspace/api-lens',
  },
  {
    id: 'code_lens',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 18 22 12 16 6"/>
        <polyline points="8 6 2 12 8 18"/>
      </svg>
    ),
    color: '#A78BFA',
    label: 'Code Lens',
    desc: 'Document code and generate flow diagrams',
    href: '/workspace/code-lens',
  },
  {
    id: 'explain_diagram',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
    ),
    color: '#F59E0B',
    label: 'Explain Diagram',
    desc: 'Upload any diagram — get plain English explanation',
    href: '/workspace/explain-diagram',
  },
] as const

export function NewArtifactModal({
  open,
  onClose,
  onNewDiagram,
  blockDiagramGeneration = false,
  onBlockedDiagramGeneration,
}: NewArtifactModalProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const { activeProjectName, activeProjectIsDefault } = useActiveProject()

  const T = {
    overlay:    'rgba(0,0,0,0.55)',
    modalBg:    isDark ? '#111113'   : '#FFFFFF',
    modalBorder:isDark ? 'rgba(255,255,255,0.08)' : '#E4E4E7',
    titleColor: isDark ? '#F1F5F9'   : '#111827',
    subtitleColor: isDark ? '#52525B' : '#9CA3AF',
    cardBg:     isDark ? 'rgba(255,255,255,0.03)' : '#FAFAFA',
    cardBorder: isDark ? 'rgba(255,255,255,0.07)' : '#E5E7EB',
    cardHoverBg:isDark ? 'rgba(255,255,255,0.06)' : '#F3F4F6',
    labelColor: isDark ? '#E2E8F0'   : '#111827',
    descColor:  isDark ? '#64748B'   : '#9CA3AF',
  }

  if (!open) return null

  const handleOption = (opt: typeof ARTIFACT_OPTIONS[number]) => {
    if (opt.id === 'diagram') {
      if (blockDiagramGeneration) {
        onClose()
        onBlockedDiagramGeneration?.()
        return
      }
      onClose()
      onNewDiagram?.()
    } else if ('href' in opt) {
      onClose()
      router.push(opt.href)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: T.overlay,
          zIndex: 1000,
          animation: 'fadeIn 0.15s ease',
        }}
      />

      {/* Modal */}
      <div style={{
        position: 'fixed',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'min(480px, 90vw)',
        background: T.modalBg,
        border: `1px solid ${T.modalBorder}`,
        borderRadius: 16,
        boxShadow: isDark
          ? '0 24px 64px rgba(0,0,0,0.6)'
          : '0 24px 64px rgba(0,0,0,0.12)',
        zIndex: 1001,
        overflow: 'hidden',
        animation: 'scaleIn 0.15s ease',
        fontFamily: 'Inter, sans-serif',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: T.titleColor }}>
              Create new
            </div>
            <div style={{ fontSize: 12, color: T.subtitleColor, marginTop: 2 }}>
              {activeProjectName && !activeProjectIsDefault ? (
                <>
                  Creating inside{' '}
                  <span style={{ color: isDark ? '#A5B4FC' : '#6366F1', fontWeight: 500 }}>
                    {activeProjectName}
                  </span>
                </>
              ) : (
                'Choose what you want to create'
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              color: T.subtitleColor, cursor: 'pointer',
              fontSize: 18, lineHeight: 1, padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Options grid */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 10, padding: '4px 24px 24px',
        }}>
          {ARTIFACT_OPTIONS.map(opt => (
            <button
              key={opt.id}
              onClick={() => handleOption(opt)}
              style={{
                padding: '16px 14px',
                borderRadius: 10,
                border: `1px solid ${T.cardBorder}`,
                background: T.cardBg,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget
                el.style.background = T.cardHoverBg
                el.style.borderColor = opt.color + '60'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget
                el.style.background = T.cardBg
                el.style.borderColor = T.cardBorder
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: opt.color + '18',
                border: `1px solid ${opt.color}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: opt.color, marginBottom: 10,
              }}>
                {opt.icon}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: T.labelColor, marginBottom: 4 }}>
                {opt.label}
              </div>
              <div style={{ fontSize: 11, color: T.descColor, lineHeight: 1.5 }}>
                {opt.desc}
              </div>
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: translate(-50%,-50%) scale(0.95) } to { opacity: 1; transform: translate(-50%,-50%) scale(1) } }
      `}</style>
    </>
  )
}
