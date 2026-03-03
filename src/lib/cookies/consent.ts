export const CookieConsent = {
  get(): 'accepted' | 'declined' | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('cookie_consent') as 'accepted' | 'declined' | null
  },

  hasConsented(): boolean {
    return this.get() === 'accepted'
  },

  hasDeclined(): boolean {
    return this.get() === 'declined'
  },

  isAnalyticsAllowed(): boolean {
    return this.hasConsented()
  },

  reset(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('cookie_consent')
    localStorage.removeItem('cookie_consent_date')
  },
}
