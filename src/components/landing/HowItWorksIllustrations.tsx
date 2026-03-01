'use client'

export function Step1Illustration() {
  return (
    <svg width="100%" height="120" viewBox="0 0 280 120">
      <rect x="10" y="20" width="260" height="80" rx="8" fill="rgba(99,102,241,0.06)" stroke="rgba(99,102,241,0.2)" strokeWidth="1"/>
      <rect x="22" y="36" width="180" height="10" rx="2" fill="rgba(99,102,241,0.25)"/>
      <rect x="22" y="52" width="140" height="10" rx="2" fill="rgba(99,102,241,0.15)"/>
      <rect x="22" y="68" width="100" height="10" rx="2" fill="rgba(99,102,241,0.1)"/>
      <rect x="220" y="80" width="8" height="14" rx="1" fill="#A78BFA" style={{ animation: 'cursorBlink 1s step-end infinite' }}/>
    </svg>
  )
}

export function Step2Illustration() {
  return (
    <svg width="100%" height="120" viewBox="0 0 280 120">
      <circle cx="50" cy="60" r="16" fill="rgba(34,197,94,0.15)" stroke="#22C55E" strokeWidth="1.5"/>
      <rect x="100" y="45" width="80" height="30" rx="5" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.4)" strokeWidth="1.5"/>
      <text x="140" y="65" fill="#A78BFA" fontSize="9" fontFamily="Inter" textAnchor="middle">Process</text>
      <circle cx="230" cy="60" r="16" fill="rgba(239,68,68,0.12)" stroke="#EF4444" strokeWidth="1.5"/>
      <line x1="66" y1="60" x2="100" y2="60" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
      <line x1="180" y1="60" x2="214" y2="60" stroke="rgba(99,102,241,0.5)" strokeWidth="1.5"/>
    </svg>
  )
}

export function Step3Illustration() {
  return (
    <svg width="100%" height="120" viewBox="0 0 280 120">
      <rect x="10" y="10" width="260" height="100" rx="8" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.07)" strokeWidth="1"/>
      <rect x="20" y="22" width="60" height="22" rx="4" fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.3)" strokeWidth="1"/>
      <text x="50" y="37" fill="#A78BFA" fontSize="8" fontFamily="Inter" textAnchor="middle">Export PNG</text>
      <rect x="88" y="22" width="60" height="22" rx="4" fill="rgba(34,197,94,0.1)" stroke="rgba(34,197,94,0.3)" strokeWidth="1"/>
      <text x="118" y="37" fill="#86EFAC" fontSize="8" fontFamily="Inter" textAnchor="middle">Share Link</text>
      <rect x="156" y="22" width="60" height="22" rx="4" fill="rgba(239,68,68,0.1)" stroke="rgba(239,68,68,0.3)" strokeWidth="1"/>
      <text x="186" y="37" fill="#FCA5A5" fontSize="8" fontFamily="Inter" textAnchor="middle">Export PDF</text>
      <rect x="20" y="58" width="240" height="40" rx="6" fill="rgba(99,102,241,0.05)" stroke="rgba(99,102,241,0.15)" strokeWidth="1"/>
      <text x="30" y="76" fill="#71717A" fontSize="8" fontFamily="JetBrains Mono, monospace">https://app.flowmapr.com/share/abc123</text>
      <text x="30" y="90" fill="#52525B" fontSize="8" fontFamily="Inter">Read-only · Anyone with the link</text>
    </svg>
  )
}
