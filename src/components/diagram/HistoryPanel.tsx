'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useTheme } from '@/lib/theme/ThemeProvider'

interface Version {
  id: string
  snapshot: Record<string, unknown>
  label: string | null
  created_at: string
}

interface HistoryPanelProps {
  diagramId: string
  open: boolean
  onClose: () => void
  onRestore: (snapshot: Record<string, unknown>) => Promise<void>
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function HistoryPanel({ diagramId, open, onClose, onRestore }: HistoryPanelProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const T = {
    panelBg:        isDark ? '#0F0F17'                  : '#FFFFFF',
    panelBorder:    isDark ? 'rgba(255,255,255,0.08)'   : '#E4E4E7',
    headerBorder:   isDark ? 'rgba(255,255,255,0.06)'   : '#E4E4E7',
    titleColor:     isDark ? '#F1F5F9'                  : '#111827',
    subtitleColor:  isDark ? '#52525B'                  : '#9CA3AF',
    closeColor:     isDark ? '#52525B'                  : '#9CA3AF',
    itemBorder:     isDark ? 'rgba(255,255,255,0.04)'   : '#F3F4F6',
    versionColor:   isDark ? '#E2E8F0'                  : '#111827',
    dateColor:      isDark ? '#52525B'                  : '#9CA3AF',
    emptyColor:     isDark ? '#52525B'                  : '#9CA3AF',
    footerBorder:   isDark ? 'rgba(255,255,255,0.06)'   : '#E4E4E7',
    footerTextColor:isDark ? '#3F3F46'                  : '#9CA3AF',
    footerBg:       isDark ? 'transparent'              : '#FAFAFA',
  }

  const [versions, setVersions] = useState<Version[]>([])
  const [loading, setLoading] = useState(false)
  const [restoring, setRestoring] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    const supabase = createClient()
    supabase
      .from('diagram_versions')
      .select('id, snapshot, label, created_at')
      .eq('diagram_id', diagramId)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setVersions((data as Version[]) ?? [])
        setLoading(false)
      })
  }, [open, diagramId])

  const handleRestore = async (v: Version) => {
    setRestoring(v.id)
    await onRestore(v.snapshot)
    setRestoring(null)
    onClose()
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 49,
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 320,
          height: '100vh',
          background: T.panelBg,
          borderLeft: `1px solid ${T.panelBorder}`,
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.2s ease',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${T.headerBorder}`,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.titleColor, fontFamily: 'Inter, sans-serif' }}>
              Version History
            </div>
            <div style={{ fontSize: 11, color: T.subtitleColor, marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
              {loading ? '…' : `${versions.length} saved version${versions.length !== 1 ? 's' : ''}`}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: T.closeColor,
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* Version list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: T.emptyColor, fontSize: 13, fontFamily: 'Inter, sans-serif' }}>
              Loading…
            </div>
          ) : versions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: T.emptyColor, fontSize: 13, lineHeight: 1.6, fontFamily: 'Inter, sans-serif' }}>
              No versions yet.<br />Versions are saved on each generation.
            </div>
          ) : (
            versions.map((v, i) => (
              <div
                key={v.id}
                style={{
                  padding: '12px 20px',
                  borderBottom: `1px solid ${T.itemBorder}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                {/* Version dot */}
                <div
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: i === 0 ? '#22C55E' : 'rgba(99,102,241,0.4)',
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: T.versionColor,
                      fontWeight: 500,
                      marginBottom: 2,
                      fontFamily: 'Inter, sans-serif',
                    }}
                  >
                    {i === 0 ? '✦ Current version' : (v.label ?? `Version ${versions.length - i}`)}
                  </div>
                  <div style={{ fontSize: 11, color: T.dateColor, fontFamily: 'Inter, sans-serif' }}>
                    {formatDate(v.created_at)}
                  </div>
                </div>

                {i !== 0 && (
                  <button
                    onClick={() => handleRestore(v)}
                    disabled={restoring === v.id}
                    style={{
                      padding: '4px 10px',
                      borderRadius: 6,
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      color: '#A5B4FC',
                      fontSize: 11,
                      fontWeight: 500,
                      fontFamily: 'Inter, sans-serif',
                      cursor: restoring === v.id ? 'wait' : 'pointer',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                      opacity: restoring && restoring !== v.id ? 0.5 : 1,
                    }}
                  >
                    {restoring === v.id ? '…' : 'Restore'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: `1px solid ${T.footerBorder}`,
            background: T.footerBg,
            fontSize: 11,
            color: T.footerTextColor,
            lineHeight: 1.6,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Restoring a version will replace the current diagram state. The current state is saved automatically before restore.
        </div>
      </div>
    </>
  )
}
