import Link from 'next/link'
import { Check, ArrowRight } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { LandingNav } from '@/components/landing/LandingNav'
import { MorphingDiagram } from '@/components/landing/MorphingDiagram'
import { HowItWorksCards } from '@/components/landing/HowItWorksCards'
import { DiagramTypesGrid } from '@/components/landing/DiagramTypesGrid'
import { SocialLinks } from '@/components/landing/SocialLinks'
import { AuroraBackground } from '@/components/landing/AuroraBackground'
import { CodeRain } from '@/components/landing/CodeRain'
import { BackToTop } from '@/components/landing/BackToTop'
import { CookieBanner } from '@/components/landing/CookieBanner'

const plans = [
  {
    name: 'Free Trial',
    price: '$0',
    period: '',
    desc: 'Try Flowmapr with no commitment',
    highlight: false,
    features: [
      'Generate up to 3 diagrams',
      'All 6 diagram types',
      'Export PNG / PDF',
      'Explain Diagram (AI description)',
      'Guided onboarding',
    ],
    cta: 'Get started free',
    href: '/signup',
  },
  {
    name: 'Basic',
    price: '$15',
    period: '/mo',
    desc: 'For individuals who diagram regularly',
    highlight: true,
    badge: 'Most popular',
    features: [
      'Generate up to 100 diagrams',
      'API Lens',
      'Export PNG / PDF',
      'Explain Diagram (AI description)',
      'Update Diagram with AI',
      'Version History (last 20)',
      'Public sharing',
    ],
    cta: 'Get started',
    href: '/signup',
  },
  {
    name: 'Pro',
    price: '$45',
    period: '/mo',
    desc: 'For power users with full access',
    highlight: false,
    features: [
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
    ],
    cta: 'Get started',
    href: '/signup',
  },
]

const faqItems = [
  {
    q: 'What diagram types does Flowmapr support?',
    a: 'BPMN 2.0 (with swimlanes, gateways, events), UML Sequence, ERD, Flowchart, C4 Architecture, and API Lens for interactive API docs from OpenAPI specs.',
  },
  {
    q: 'How do AI generation credits work?',
    a: 'Each text-to-diagram generation uses 1 credit. Re-prompting costs 1 credit. Credits reset monthly. Free trial credits are a lifetime allowance.',
  },
  {
    q: 'Can I cancel my subscription anytime?',
    a: "Yes. Cancel anytime from account settings. You'll keep access until end of billing period, then revert to Free Trial limits.",
  },
  {
    q: 'Is my data private?',
    a: 'Yes. Diagrams are private by default with row-level security. Only you can see them unless you create a public share link.',
  },
  {
    q: 'What is API Lens?',
    a: 'API Lens takes an OpenAPI spec, Swagger file, or description of API endpoints and turns it into interactive documentation with an architecture diagram showing how services connect.',
  },
  {
    q: 'What is Code Lens?',
    a: 'Code Lens takes your code — TypeScript, JavaScript, Python, SQL, or Go — and turns it into clear documentation and diagrams. It explains what the code does, why it exists, key business rules, inputs and outputs, edge cases, and dependencies. You can get documentation only, or documentation paired with a visual flowchart of the code logic.',
  },
]

const sectionTitle = (text: string) => (
  <h2 style={{
    fontSize: 36, fontWeight: 800, fontFamily: 'Inter, sans-serif',
    letterSpacing: '-0.03em', color: '#F1F5F9', textAlign: 'center', lineHeight: 1.15,
    marginBottom: 0,
  }}>
    {text}
  </h2>
)

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090B', color: '#F1F5F9', position: 'relative', overflowX: 'hidden' }}>
      <AuroraBackground />
      <CodeRain />
      <LandingNav />

      {/* Hero */}
      <section style={{ paddingTop: 120, paddingBottom: 80, textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 700, margin: '0 auto', padding: '0 24px' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
            borderRadius: 100, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)',
            fontSize: 12, fontWeight: 600, color: '#A78BFA', fontFamily: 'Inter, sans-serif',
            marginBottom: 28, letterSpacing: '0.04em',
          }}>
            ✦ Now with API Lens — turn OpenAPI specs into living docs
          </div>
          <h1 style={{
            fontSize: 'clamp(38px, 6vw, 62px)', fontWeight: 900, fontFamily: 'Inter, sans-serif',
            letterSpacing: '-0.04em', lineHeight: 1.1, color: '#F8FAFC',
            marginBottom: 20,
          }}>
            Turn requirements<br />into diagrams.{' '}
            <span style={{
              background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Instantly.
            </span>
          </h1>
          <p style={{ fontSize: 18, color: '#94A3B8', fontFamily: 'Inter, sans-serif', lineHeight: 1.6, marginBottom: 40, maxWidth: 520, margin: '0 auto 40px' }}>
            AI-powered BPMN, UML, C4, ERD and Flowchart generator — from plain text, in seconds.
            No code. No Visio. No moving boxes for 40 minutes.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/signup" style={{
              padding: '14px 32px', borderRadius: 10, fontSize: 15, fontWeight: 700,
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', color: 'white',
              textDecoration: 'none', fontFamily: 'Inter, sans-serif',
              boxShadow: '0 8px 32px rgba(99,102,241,0.4)', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              Try free — no card required
              <ArrowRight size={16} />
            </Link>
            <a href="#how-it-works" style={{
              padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
              background: 'rgba(255,255,255,0.06)', color: '#E2E8F0',
              border: '1px solid rgba(255,255,255,0.1)', textDecoration: 'none', fontFamily: 'Inter, sans-serif',
            }}>
              See how it works
            </a>
          </div>
          {/* Trust strip */}
          <div style={{
            marginTop: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: 6, flexWrap: 'wrap',
            fontSize: 12, color: '#52525B', fontFamily: 'Inter, sans-serif',
          }}>
            {['✦ No setup', 'Guided first diagram', 'All 6 diagram types', 'Explain & Update with AI'].map((item, i, arr) => (
              <span key={item} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#71717A' }}>{item}</span>
                {i < arr.length - 1 && <span style={{ color: '#27272A' }}>·</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Hero diagram */}
        <div style={{ maxWidth: 900, margin: '60px auto 0', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <MorphingDiagram />
        </div>
      </section>

      {/* Diagram types */}
      <section id="features" style={{ padding: '80px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {sectionTitle('Every diagram type you need — BPMN, UML, C4, ERD and more')}
            <p style={{ marginTop: 12, color: '#71717A', fontFamily: 'Inter, sans-serif', fontSize: 15 }}>
              From business processes to API documentation — all in one tool.
            </p>
          </div>
          <DiagramTypesGrid />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" style={{ padding: '80px 0', position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {sectionTitle('How it works')}
          </div>
          <HowItWorksCards />
        </div>
      </section>

      {/* New features highlight */}
      <section style={{ padding: '80px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {sectionTitle('Everything you need to diagram faster')}
            <p style={{ marginTop: 12, color: '#71717A', fontFamily: 'Inter, sans-serif', fontSize: 15 }}>
              Beyond generation — Flowmapr helps you understand, update, and share your diagrams.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[
              {
                color: '#6366F1',
                bg: 'rgba(99,102,241,0.08)',
                border: 'rgba(99,102,241,0.2)',
                badge: 'All plans · Free',
                badgeColor: '#818CF8',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
                  </svg>
                ),
                title: 'Explain any diagram',
                desc: 'Click Explain on any diagram — AI writes a plain-English description covering components, flow, and purpose. Perfect for onboarding new teammates.',
              },
              {
                color: '#22C55E',
                bg: 'rgba(34,197,94,0.07)',
                border: 'rgba(34,197,94,0.2)',
                badge: 'Basic + Pro',
                badgeColor: '#4ADE80',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                  </svg>
                ),
                title: 'Update with AI',
                desc: "Tell the AI what to change — 'Add a fraud check step before payment' — and it updates the diagram without starting over.",
              },
              {
                color: '#3B82F6',
                bg: 'rgba(59,130,246,0.07)',
                border: 'rgba(59,130,246,0.2)',
                badge: 'Basic + Pro',
                badgeColor: '#60A5FA',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                  </svg>
                ),
                title: 'Version History',
                desc: 'Every generation is auto-saved. Click History to browse all previous versions and restore any of them with one click.',
              },
              {
                color: '#F59E0B',
                bg: 'rgba(245,158,11,0.07)',
                border: 'rgba(245,158,11,0.2)',
                badge: 'All plans · Free',
                badgeColor: '#FCD34D',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                  </svg>
                ),
                title: 'Guided onboarding',
                desc: 'First-time setup walks you through your diagram type, example prompt, and generation — from zero to first diagram in under 60 seconds.',
              },
              {
                color: '#EC4899',
                bg: 'rgba(236,72,153,0.07)',
                border: 'rgba(236,72,153,0.2)',
                badge: 'Pro only',
                badgeColor: '#F472B6',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                  </svg>
                ),
                title: 'Export anywhere',
                desc: 'Push diagrams directly to GitHub README, Confluence pages, or Notion docs — without re-uploading or screenshotting manually.',
              },
              {
                color: '#A78BFA',
                bg: 'rgba(167,139,250,0.07)',
                border: 'rgba(167,139,250,0.2)',
                badge: 'All plans · Free',
                badgeColor: '#C4B5FD',
                icon: (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                ),
                title: 'All 6 diagram types',
                desc: 'BPMN, UML Sequence, ERD, Flowchart, C4 Architecture, and API Lens — every major format in one tool, no switching between apps.',
              },
            ].map(card => (
              <div key={card.title} style={{
                padding: '22px 22px 20px',
                background: card.bg,
                border: `1px solid ${card.border}`,
                borderRadius: 14,
                display: 'flex', flexDirection: 'column', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 9,
                    background: `${card.color}18`,
                    border: `1px solid ${card.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: card.color, flexShrink: 0,
                  }}>
                    {card.icon}
                  </div>
                  <span style={{
                    padding: '3px 8px', borderRadius: 20,
                    background: `${card.color}14`,
                    border: `1px solid ${card.color}28`,
                    fontSize: 10, fontWeight: 600, color: card.badgeColor,
                    fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                  }}>
                    {card.badge}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: 12.5, color: '#71717A', fontFamily: 'Inter, sans-serif', lineHeight: 1.65 }}>
                    {card.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ padding: '80px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            {sectionTitle('Simple, transparent pricing')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 48 }}>
            {plans.map(plan => (
              <div key={plan.name} style={{
                padding: 28, borderRadius: 14, position: 'relative',
                background: plan.highlight ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                border: plan.highlight ? '1.5px solid rgba(99,102,241,0.4)' : '1px solid rgba(255,255,255,0.07)',
                boxShadow: plan.highlight ? '0 0 40px rgba(99,102,241,0.08)' : 'none',
                display: 'flex', flexDirection: 'column',
              }}>
                {plan.badge && (
                  <div style={{
                    position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                    padding: '4px 14px', borderRadius: 100,
                    background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
                    fontSize: 11, fontWeight: 700, color: 'white', fontFamily: 'Inter, sans-serif', whiteSpace: 'nowrap',
                  }}>
                    {plan.badge}
                  </div>
                )}
                <div style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', marginBottom: 8 }}>{plan.name}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 6 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, color: '#F8FAFC', fontFamily: 'Inter, sans-serif', letterSpacing: '-0.04em' }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: 13, color: '#71717A', fontFamily: 'Inter, sans-serif' }}>{plan.period}</span>}
                </div>
                <p style={{ fontSize: 12, color: '#71717A', fontFamily: 'Inter, sans-serif', marginBottom: 16 }}>{plan.desc}</p>
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '0 0 16px' }} />
                <ul style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, listStyle: 'none', padding: 0, margin: '0 0 24px' }}>
                  {plan.features.map(f => (
                    <li key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: '#94A3B8', fontFamily: 'Inter, sans-serif' }}>
                      <Check size={14} style={{ color: '#22C55E', marginTop: 1, flexShrink: 0 }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href={plan.href} style={{
                  display: 'block', textAlign: 'center', padding: '11px 0', borderRadius: 9,
                  background: plan.highlight ? 'linear-gradient(135deg, #6366F1, #8B5CF6)' : 'rgba(255,255,255,0.06)',
                  color: plan.highlight ? 'white' : '#94A3B8', fontWeight: 600, fontSize: 13,
                  border: plan.highlight ? 'none' : '1px solid rgba(255,255,255,0.08)',
                  textDecoration: 'none', fontFamily: 'Inter, sans-serif',
                  boxShadow: plan.highlight ? '0 4px 20px rgba(99,102,241,0.3)' : 'none',
                }}>
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ padding: '80px 0', position: 'relative', zIndex: 1, background: 'rgba(255,255,255,0.01)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {sectionTitle('Frequently asked questions')}
          </div>
          <Accordion type="single" collapsible>
            {faqItems.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`} style={{ borderColor: 'rgba(255,255,255,0.07)' }}>
                <AccordionTrigger style={{ fontSize: 14, fontFamily: 'Inter, sans-serif', color: '#E2E8F0', textAlign: 'left' }}>
                  {item.q}
                </AccordionTrigger>
                <AccordionContent style={{ fontSize: 13, color: '#71717A', fontFamily: 'Inter, sans-serif', lineHeight: 1.6 }}>
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '40px 24px', borderTop: '1px solid rgba(255,255,255,0.06)', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{
              fontSize: 16, fontWeight: 800, fontFamily: 'Inter, sans-serif',
              background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              flowmapr
            </span>
            <span style={{ color: '#3F3F46', fontSize: 12, fontFamily: 'Inter, sans-serif' }}>
              © {new Date().getFullYear()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {[
              { label: 'Privacy Policy', href: '/privacy' },
              { label: 'Terms of Service', href: '/terms' },
            ].map(({ label, href }) => (
              <a key={label} href={href} style={{ fontSize: 12, color: '#52525B', fontFamily: 'Inter, sans-serif', textDecoration: 'none' }}>
                {label}
              </a>
            ))}
            <SocialLinks />
          </div>
        </div>
      </footer>

      <BackToTop />
      <CookieBanner />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'Flowmapr',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description: 'AI-powered diagram generator for BPMN, UML Sequence, ERD, Flowchart, C4 and API documentation.',
            url: 'https://app.flowmapr.com',
            offers: [
              { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
              { '@type': 'Offer', name: 'Basic', price: '15', priceCurrency: 'USD', billingIncrement: 'month' },
              { '@type': 'Offer', name: 'Pro', price: '45', priceCurrency: 'USD', billingIncrement: 'month' },
            ],
            featureList: [
              'BPMN 2.0 diagram generation',
              'UML Sequence diagram generation',
              'C4 architecture diagrams',
              'ERD generation',
              'API Lens from OpenAPI specs',
              'Code Lens from code snippets',
              'Export PNG and PDF',
              'Public sharing',
            ],
          }),
        }}
      />
    </div>
  )
}
