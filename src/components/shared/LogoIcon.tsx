export function LogoIcon({ size = 28, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" />
          <stop offset="1" stopColor="#A78BFA" />
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="21" height="8" rx="3" fill="url(#logoGrad)" />
      <rect x="3" y="14" width="15" height="8" rx="3" fill="url(#logoGrad)" opacity="0.85" />
      <rect x="3" y="25" width="10" height="7" rx="3" fill="url(#logoGrad)" opacity="0.7" />
      <circle cx="24" cy="7" r="2" fill="white" opacity="0.65" />
      <circle cx="18" cy="18" r="2" fill="white" opacity="0.65" />
      <circle cx="13" cy="28.5" r="2" fill="white" opacity="0.65" />
    </svg>
  )
}

export function LogoMark({ size = 32 }: { size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
        borderRadius: Math.round(size * 0.28),
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: '#fff',
          fontSize: Math.round(size * 0.52),
          fontWeight: 700,
          fontFamily: 'Inter, sans-serif',
          lineHeight: 1,
        }}
      >
        F
      </span>
    </div>
  )
}

export function Logo({ size = 32 }: { size?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <LogoMark size={size} />
      <span
        style={{
          fontSize: Math.round(size * 0.5),
          fontWeight: 700,
          color: '#F8FAFC',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '-0.02em',
        }}
      >
        Flowmapr
      </span>
    </div>
  )
}
