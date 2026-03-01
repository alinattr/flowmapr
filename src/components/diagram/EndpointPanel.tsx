'use client'

import { useState } from 'react'
import { X, ChevronDown, ChevronRight } from 'lucide-react'

interface ApiEndpoint {
  id: string
  method: string
  path: string
  summary: string
  description?: string
  tags?: string[]
  parameters?: Array<{
    name: string
    in: string
    required: boolean
    type: string
    description?: string
  }>
  requestBody?: { contentType: string; schema: string } | null
  responses?: Array<{ status: number; description: string; schema?: string | null }>
}

const METHOD_COLORS: Record<string, { bg: string; text: string }> = {
  GET:    { bg: 'rgba(34,197,94,0.2)',   text: '#22C55E' },
  POST:   { bg: 'rgba(59,130,246,0.2)',  text: '#3B82F6' },
  PUT:    { bg: 'rgba(234,179,8,0.2)',   text: '#EAB308' },
  PATCH:  { bg: 'rgba(249,115,22,0.2)',  text: '#F97316' },
  DELETE: { bg: 'rgba(239,68,68,0.2)',   text: '#EF4444' },
  OPTIONS:{ bg: 'rgba(148,163,184,0.2)', text: '#94A3B8' },
}

interface EndpointPanelProps {
  endpoints: ApiEndpoint[]
  serviceName: string
  onClose: () => void
}

function MethodBadge({ method }: { method: string }) {
  const c = METHOD_COLORS[method] ?? { bg: 'rgba(99,102,241,0.2)', text: '#6366F1' }
  return (
    <span className="api-lens-method-badge" style={{
      padding: '2px 7px', borderRadius: 4,
      background: c.bg, color: c.text,
      fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
      letterSpacing: '0.04em',
    }}>
      {method}
    </span>
  )
}

function EndpointRow({ ep }: { ep: ApiEndpoint }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="api-lens-endpoint" style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 6, overflow: 'hidden', marginBottom: 6,
    }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', padding: '8px 10px',
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {open ? <ChevronDown size={12} color="#52525B" /> : <ChevronRight size={12} color="#52525B" />}
        <MethodBadge method={ep.method} />
        <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: '#C4B5FD', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {ep.path}
        </span>
      </button>

      {open && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {ep.summary && (
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-primary, #E4E4E7)', fontFamily: 'Inter, sans-serif' }}>
              {ep.summary}
            </div>
          )}
          {ep.description && (
            <div style={{ fontSize: 11, color: '#71717A', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
              {ep.description}
            </div>
          )}

          {ep.parameters && ep.parameters.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#52525B', fontFamily: 'Inter, sans-serif', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Parameters
              </div>
              {ep.parameters.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 4, fontSize: 11, fontFamily: 'Inter, sans-serif' }}>
                  <code style={{ color: '#A78BFA', background: 'rgba(167,139,250,0.08)', borderRadius: 3, padding: '1px 4px', fontSize: 10 }}>{p.name}</code>
                  <span style={{ color: '#52525B', fontSize: 10 }}>{p.in}</span>
                  <span style={{ color: '#71717A', flex: 1 }}>{p.description}</span>
                  {p.required && <span style={{ color: '#EF4444', fontSize: 9 }}>required</span>}
                </div>
              ))}
            </div>
          )}

          {ep.requestBody && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#52525B', fontFamily: 'Inter, sans-serif', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Request Body
              </div>
              <pre style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', color: '#94A3B8', background: 'rgba(0,0,0,0.3)', borderRadius: 4, padding: 8, overflow: 'auto', margin: 0 }}>
                {ep.requestBody.schema}
              </pre>
            </div>
          )}

          {ep.responses && ep.responses.length > 0 && (
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, color: '#52525B', fontFamily: 'Inter, sans-serif', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Responses
              </div>
              {ep.responses.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{
                    fontSize: 10, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
                    color: r.status < 300 ? '#22C55E' : r.status < 400 ? '#EAB308' : '#EF4444',
                  }}>
                    {r.status}
                  </span>
                  <span style={{ fontSize: 11, color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>{r.description}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function EndpointPanel({ endpoints, serviceName, onClose }: EndpointPanelProps) {
  const [search, setSearch] = useState('')

  const filtered = endpoints.filter(ep =>
    ep.path.toLowerCase().includes(search.toLowerCase()) ||
    ep.method.toLowerCase().includes(search.toLowerCase()) ||
    ep.summary.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div style={{
      width: 320, height: '100%', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      background: 'var(--color-bg-secondary, rgba(9,9,11,0.95))',
      borderLeft: '1px solid var(--color-border, rgba(255,255,255,0.08))',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
      }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-text-primary, #E4E4E7)', fontFamily: 'Inter, sans-serif' }}>
            {serviceName}
          </div>
          <div style={{ fontSize: 11, color: '#52525B', fontFamily: 'Inter, sans-serif', marginTop: 2 }}>
            {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525B', padding: 4, borderRadius: 4 }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Search */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter endpoints…"
          style={{
            width: '100%', padding: '6px 10px', borderRadius: 6,
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--color-text-primary, #E4E4E7)',
            fontSize: 12, fontFamily: 'Inter, sans-serif', outline: 'none',
          }}
        />
      </div>

      {/* Endpoint list */}
      <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#52525B', fontSize: 12, fontFamily: 'Inter, sans-serif', marginTop: 40 }}>
            No endpoints match your filter
          </div>
        ) : (
          filtered.map(ep => <EndpointRow key={ep.id} ep={ep} />)
        )}
      </div>
    </div>
  )
}
