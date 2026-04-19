'use client'

import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { useTheme } from '@/lib/theme/ThemeProvider'
import { Check } from 'lucide-react'

interface GenerationLimitUpgradeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentPlanLabel?: string
}

export function GenerationLimitUpgradeModal({
  open,
  onOpenChange,
  currentPlanLabel = 'Free',
}: GenerationLimitUpgradeModalProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'

  const T = {
    title: isDark ? '#F8FAFC' : '#0F0F13',
    text: isDark ? '#A1A1AA' : '#52525B',
    planTitle: isDark ? '#F1F5F9' : '#0F0F13',
    price: isDark ? '#F8FAFC' : '#0F0F13',
    period: isDark ? '#71717A' : '#A1A1AA',
    desc: isDark ? '#71717A' : '#52525B',
    feature: isDark ? '#94A3B8' : '#52525B',
    separator: isDark ? 'rgba(255,255,255,0.06)' : '#E4E4E7',
    check: '#22C55E',
    basicBtnHover: isDark ? '#5458EA' : '#4747C2',
  }

  const handleUpgrade = () => {
    onOpenChange(false)
    router.push('/settings#billing')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="p-0 overflow-hidden"
        style={{
          width: 'min(860px, calc(100vw - 32px))',
          minWidth: 'min(680px, calc(100vw - 32px))',
          maxWidth: 860,
        }}
      >
        <div style={{ padding: 24, background: isDark ? '#111113' : '#FFFFFF' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h3 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: T.title, fontFamily: 'Inter, sans-serif' }}>
              You&apos;ve used all your free generations
            </h3>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: T.text, fontFamily: 'Inter, sans-serif' }}>
              Upgrade to keep creating diagrams
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, alignItems: 'stretch' }}>
            {/* Free */}
            <div style={{
              padding: 28,
              borderRadius: 14,
              position: 'relative',
              background: isDark ? 'rgba(255,255,255,0.02)' : '#F7F7F8',
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E4E4E7',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              opacity: 0.9,
            }}>
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                padding: '4px 14px', borderRadius: 100,
                background: isDark ? 'rgba(113,113,122,0.35)' : '#EAEAF0',
                fontSize: 11, fontWeight: 700,
                color: isDark ? '#D4D4D8' : '#6B7280',
                fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
              }}>
                Current plan
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.planTitle, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
                {currentPlanLabel}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: T.price, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.04em' }}>
                  $0
                </span>
              </div>
              <p style={{ fontSize: 12, color: T.desc, fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>
                Try Flowmapr with no commitment
              </p>
              <div style={{ borderTop: `1px solid ${T.separator}`, margin: '0 0 16px' }} />
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: 0 }}>
                {[
                  'Generate up to 3 diagrams',
                  'All 6 diagram types',
                  'Export PNG / PDF',
                  'Explain Diagram (AI description)',
                  'Guided onboarding',
                ].map((feature) => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: T.feature, fontFamily: 'Inter, sans-serif' }}>
                    <Check size={14} style={{ color: T.check, marginTop: 1, flexShrink: 0 }} />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            {/* Basic */}
            <div style={{
              padding: 28,
              borderRadius: 14,
              position: 'relative',
              background: isDark ? 'rgba(99,102,241,0.06)' : 'rgba(91,91,214,0.06)',
              border: isDark ? '1.5px solid rgba(99,102,241,0.4)' : '1.5px solid rgba(91,91,214,0.35)',
              boxShadow: isDark ? '0 0 40px rgba(99,102,241,0.08)' : '0 0 24px rgba(91,91,214,0.08)',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}>
              <div style={{
                position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                padding: '4px 14px', borderRadius: 100,
                background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
                fontSize: 11, fontWeight: 700, color: 'white', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
              }}>
                Most popular
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.planTitle, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
                Basic
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: T.price, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.04em' }}>
                  $15
                </span>
                <span style={{ fontSize: 13, color: T.period, fontFamily: 'Inter, sans-serif' }}>/mo</span>
              </div>
              <p style={{ fontSize: 12, color: T.desc, fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>
                For individuals who diagram regularly
              </p>
              <div style={{ borderTop: `1px solid ${T.separator}`, margin: '0 0 16px' }} />
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                {[
                  'Generate up to 100 diagrams',
                  'API Lens',
                  'Export PNG / PDF',
                  'Explain Diagram (AI description)',
                  'Update Diagram with AI',
                  'Version History (last 20)',
                  'Public sharing',
                ].map((feature) => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: T.feature, fontFamily: 'Inter, sans-serif' }}>
                    <Check size={14} style={{ color: T.check, marginTop: 1, flexShrink: 0 }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleUpgrade}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '11px 0',
                  borderRadius: 9,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: 13,
                  border: 'none',
                  textDecoration: 'none',
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 4px 20px rgba(99,102,241,0.3)',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = T.basicBtnHover }}
                onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
              >
                Upgrade →
              </button>
            </div>

            {/* Pro */}
            <div style={{
              padding: 28,
              borderRadius: 14,
              position: 'relative',
              background: isDark ? 'rgba(255,255,255,0.02)' : '#FFFFFF',
              border: isDark ? '1px solid rgba(255,255,255,0.07)' : '1px solid #E4E4E7',
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
            }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: T.planTitle, fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>
                Pro
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: T.price, fontFamily: 'Inter, sans-serif', letterSpacing: '-0.04em' }}>
                  $45
                </span>
                <span style={{ fontSize: 13, color: T.period, fontFamily: 'Inter, sans-serif' }}>/mo</span>
              </div>
              <p style={{ fontSize: 12, color: T.desc, fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>
                For power users with full access
              </p>
              <div style={{ borderTop: `1px solid ${T.separator}`, margin: '0 0 16px' }} />
              <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                {[
                  'Generate up to 500 diagrams',
                  'API Lens',
                  'Code Lens',
                  'Export PNG / PDF',
                  'Explain Diagram (AI description)',
                  'Update Diagram with AI',
                  'Version History (last 20)',
                  'Export to GitHub / Notion / Confluence',
                  'Public sharing',
                  'Share & embed',
                ].map((feature) => (
                  <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: T.feature, fontFamily: 'Inter, sans-serif' }}>
                    <Check size={14} style={{ color: T.check, marginTop: 1, flexShrink: 0 }} />
                    {feature}
                  </li>
                ))}
              </ul>
              <button
                onClick={handleUpgrade}
                style={{
                  display: 'block',
                  textAlign: 'center',
                  padding: '11px 0',
                  borderRadius: 9,
                  background: isDark ? 'rgba(255,255,255,0.06)' : '#F7F7F8',
                  color: isDark ? '#94A3B8' : '#52525B',
                  fontWeight: 600,
                  fontSize: 13,
                  border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid #E4E4E7',
                  textDecoration: 'none',
                  fontFamily: 'Inter, sans-serif',
                  cursor: 'pointer',
                }}
              >
                Upgrade →
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
            <button
              onClick={() => onOpenChange(false)}
              style={{
                border: 'none', background: 'transparent',
                color: T.text, fontSize: 13, fontWeight: 500, cursor: 'pointer',
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Maybe later
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
