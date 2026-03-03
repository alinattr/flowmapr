'use client'
import { useState, useEffect, useRef } from 'react'
import type { Node, Edge } from '@xyflow/react'
import { useTheme } from '@/lib/theme/ThemeProvider'

interface ExplainPanelProps {
  open: boolean
  onClose: () => void
  diagramType: string
  diagramTitle: string
  nodes: Node[]
  edges: Edge[]
}

export function ExplainPanel({
  open,
  onClose,
  diagramType,
  diagramTitle,
  nodes,
  edges,
}: ExplainPanelProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const T = {
    panelBg:        isDark ? '#0F0F17'                  : '#FFFFFF',
    panelBorder:    isDark ? 'rgba(255,255,255,0.08)'   : '#E4E4E7',
    headerBorder:   isDark ? 'rgba(255,255,255,0.06)'   : '#E4E4E7',
    titleColor:     isDark ? '#F1F5F9'                  : '#111827',
    subtitleColor:  isDark ? '#52525B'                  : '#9CA3AF',
    closeColor:     isDark ? '#52525B'                  : '#9CA3AF',
    skeletonBg:     isDark ? 'rgba(255,255,255,0.05)'   : 'rgba(0,0,0,0.06)',
    textColor:      isDark ? '#CBD5E1'                  : '#374151',
    footerBg:       isDark ? 'transparent'              : '#FAFAFA',
    copyBtnBg:      isDark ? 'rgba(255,255,255,0.05)'   : 'rgba(0,0,0,0.04)',
    copyBtnBorder:  isDark ? 'rgba(255,255,255,0.08)'   : '#E5E7EB',
    copyBtnColor:   isDark ? '#94A3B8'                  : '#374151',
  }

  const [explanation, setExplanation] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (open) generateExplanation()
    return () => {
      abortRef.current?.abort()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  async function generateExplanation() {
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    setExplanation('')

    const diagramSummary = buildDiagramSummary(nodes, edges, diagramType)

    try {
      const response = await fetch('/api/explain-diagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diagramType, diagramTitle, diagramSummary }),
        signal: controller.signal,
      })

      if (!response.ok) {
        setExplanation('Failed to generate explanation. Please try again.')
        setLoading(false)
        return
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          setExplanation(prev => prev + decoder.decode(value, { stream: true }))
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setExplanation('Failed to generate explanation. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(explanation)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!open) return null

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.4)',
          zIndex: 49,
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed',
        top: 0, right: 0,
        width: 380,
        height: '100vh',
        background: T.panelBg,
        borderLeft: `1px solid ${T.panelBorder}`,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideInRight 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `1px solid ${T.headerBorder}`,
          flexShrink: 0,
        }}>
          <div>
            <div style={{
              fontSize: 14, fontWeight: 600, color: T.titleColor,
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: 'Inter, sans-serif',
            }}>
              <span style={{
                width: 22, height: 22, borderRadius: 6,
                background: 'rgba(99,102,241,0.15)',
                border: '1px solid rgba(99,102,241,0.3)',
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12,
              }}>
                ✦
              </span>
              Diagram Explanation
            </div>
            <div style={{ fontSize: 11, color: T.subtitleColor, marginTop: 2, fontFamily: 'Inter, sans-serif' }}>
              AI-generated description
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: T.closeColor, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 4 }}
          >
            ✕
          </button>
        </div>

        {/* Type badge */}
        <div style={{ padding: '12px 20px 0', flexShrink: 0 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '4px 10px', borderRadius: 6,
            background: 'rgba(99,102,241,0.1)',
            border: '1px solid rgba(99,102,241,0.2)',
            fontSize: 11, fontWeight: 600, color: '#A5B4FC',
            fontFamily: 'Inter, sans-serif',
            maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {diagramType} · {diagramTitle}
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {loading && !explanation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[100, 85, 92, 70, 88, 60, 95].map((w, i) => (
                <div key={i} style={{
                  height: 13,
                  width: `${w}%`,
                  borderRadius: 4,
                  background: T.skeletonBg,
                  animation: `pulse 1.5s ease infinite`,
                  animationDelay: `${i * 0.1}s`,
                }} />
              ))}
            </div>
          ) : (
            <div style={{
              fontSize: 13, color: T.textColor,
              lineHeight: 1.8, fontFamily: 'Inter, sans-serif',
              whiteSpace: 'pre-wrap',
            }}>
              {explanation}
              {loading && (
                <span style={{
                  display: 'inline-block',
                  width: 8, height: 14,
                  background: '#6366F1',
                  marginLeft: 2,
                  animation: 'blink 1s step-end infinite',
                  borderRadius: 2,
                  verticalAlign: 'text-bottom',
                }} />
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {explanation && !loading && (
          <div style={{
            padding: '12px 20px',
            borderTop: `1px solid ${T.headerBorder}`,
            background: T.footerBg,
            display: 'flex', gap: 8, flexShrink: 0,
          }}>
            <button
              onClick={handleCopy}
              style={{
                flex: 1, padding: '8px', borderRadius: 8,
                background: copied ? 'rgba(34,197,94,0.1)' : T.copyBtnBg,
                border: copied ? '1px solid rgba(34,197,94,0.3)' : `1px solid ${T.copyBtnBorder}`,
                color: copied ? '#4ADE80' : T.copyBtnColor,
                fontSize: 12, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                cursor: 'pointer', transition: 'all 0.2s ease',
              }}
            >
              {copied ? '✓ Copied' : 'Copy text'}
            </button>
            <button
              onClick={generateExplanation}
              style={{
                flex: 1, padding: '8px', borderRadius: 8,
                background: 'rgba(99,102,241,0.1)',
                border: '1px solid rgba(99,102,241,0.25)',
                color: '#A5B4FC',
                fontSize: 12, fontWeight: 500, fontFamily: 'Inter, sans-serif',
                cursor: 'pointer',
              }}
            >
              ↺ Regenerate
            </button>
          </div>
        )}
      </div>
    </>
  )
}

function buildDiagramSummary(nodes: Node[], edges: Edge[], diagramType: string): string {
  const nodeLabels = nodes
    .map(n => {
      const d = n.data as Record<string, unknown>
      return (d?.label as string) || (d?.name as string) || n.id
    })
    .filter(Boolean)
    .join(', ')

  const edgeDescriptions = edges
    .map(e => {
      const fromNode = nodes.find(n => n.id === e.source)
      const toNode = nodes.find(n => n.id === e.target)
      const fromD = fromNode?.data as Record<string, unknown> | undefined
      const toD = toNode?.data as Record<string, unknown> | undefined
      const from = (fromD?.label as string) || (fromD?.name as string) || e.source
      const to = (toD?.label as string) || (toD?.name as string) || e.target
      const eData = e.data as Record<string, unknown> | undefined
      const label = (e.label as string) || (eData?.label as string) || ''
      return label ? `${from} → ${to} (${label})` : `${from} → ${to}`
    })
    .join(', ')

  return `Diagram type: ${diagramType}\nNodes/Elements: ${nodeLabels}${edgeDescriptions ? `\nConnections: ${edgeDescriptions}` : ''}`
}
