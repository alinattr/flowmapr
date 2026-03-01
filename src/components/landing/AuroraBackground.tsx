'use client'

export function AuroraBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: '-20%', left: '-10%',
        width: '60vw', height: '60vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
        animation: 'auroraFloat1 18s ease-in-out infinite alternate',
      }}/>
      <div style={{
        position: 'absolute', top: '10%', right: '-15%',
        width: '50vw', height: '50vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)',
        animation: 'auroraFloat2 14s ease-in-out infinite alternate',
      }}/>
      <div style={{
        position: 'absolute', bottom: '0%', left: '20%',
        width: '40vw', height: '40vw', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(6,182,212,0.05) 0%, transparent 70%)',
        animation: 'auroraFloat3 16s ease-in-out infinite alternate',
      }}/>
    </div>
  )
}
