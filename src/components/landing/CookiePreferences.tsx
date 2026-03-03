'use client'

export function CookiePreferences() {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 600, color: '#C4B5FD', marginBottom: 10 }}>
        12. Cookie Preferences
      </h2>
      <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.8 }}>
        You can update your cookie preferences at any time.{' '}
        <button
          onClick={() => {
            localStorage.removeItem('cookie_consent')
            localStorage.removeItem('cookie_consent_date')
            window.location.reload()
          }}
          style={{
            background: 'none',
            border: 'none',
            color: '#818CF8',
            cursor: 'pointer',
            fontSize: 'inherit',
            fontFamily: 'inherit',
            padding: 0,
            textDecoration: 'underline',
            textUnderlineOffset: 2,
          }}
        >
          Reset cookie preferences
        </button>{' '}
        to see the consent banner again.
      </p>
    </div>
  )
}
