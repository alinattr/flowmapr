'use client'

export function DiagramTypesGrid() {
  const types = [
    { name: 'BPMN 2.0', desc: 'Business process flows with swimlanes, gateways, and events', color: '#6366F1', icon: '⬡' },
    { name: 'UML Sequence', desc: 'System interactions and message flows between components', color: '#22C55E', icon: '↔' },
    { name: 'Flowchart', desc: 'Decision trees and process flows for any workflow', color: '#F59E0B', icon: '◇' },
    { name: 'C4 Model (L1)', desc: 'System context — people, systems, and their relationships', color: '#A78BFA', icon: '⬛' },
    { name: 'C4 Model (L2)', desc: 'Container diagram — services, databases, and frontends', color: '#8B5CF6', icon: '⬛' },
    { name: 'API Lens', desc: 'Interactive API documentation from OpenAPI specs', color: '#06B6D4', icon: '⚡' },
  ]

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
      {types.map((t, i) => (
        <div
          key={i}
          style={{
            padding: '20px 24px',
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 12,
            transition: 'all 0.2s ease',
            cursor: 'default',
          }}
          onMouseEnter={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.05)'
            el.style.borderColor = `${t.color}40`
            el.style.transform = 'translateY(-2px)'
            el.style.boxShadow = `0 8px 24px ${t.color}15`
          }}
          onMouseLeave={e => {
            const el = e.currentTarget as HTMLElement
            el.style.background = 'rgba(255,255,255,0.03)'
            el.style.borderColor = 'rgba(255,255,255,0.07)'
            el.style.transform = 'none'
            el.style.boxShadow = 'none'
          }}
        >
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `${t.color}18`,
            border: `1px solid ${t.color}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, marginBottom: 12, color: t.color,
          }}>
            {t.icon}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
            {t.name}
          </div>
          <div style={{ fontSize: 12, color: '#71717A', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
            {t.desc}
          </div>
        </div>
      ))}
    </div>
  )
}
