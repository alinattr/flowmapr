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

const plans = [
  {
    name: 'Free Trial',
    price: '$0',
    period: '',
    desc: 'Try Flowmapr with no commitment',
    highlight: false,
    features: [
      '5 AI generations (lifetime)',
      'Up to 5 diagrams',
      'All diagram types',
      'Export PNG / PDF',
      'Public sharing',
    ],
    cta: 'Get started free',
    href: '/signup',
  },
  {
    name: 'Basic',
    price: '$20',
    period: '/mo',
    desc: 'For individuals who diagram regularly',
    highlight: true,
    badge: 'Most popular',
    features: [
      '100 AI generations / month',
      'Up to 50 diagrams',
      'API Lens',
      'Export PNG / PDF',
      'Public sharing',
      'Upload doc as context',
    ],
    cta: 'Get started',
    href: '/signup',
  },
  {
    name: 'Pro',
    price: '$50',
    period: '/mo',
    desc: 'For power users with full access',
    highlight: false,
    features: [
      '500 AI generations / month',
      'Unlimited diagrams',
      'API Lens',
      'Export all formats',
      'Share & embed',
      'Upload doc as context',
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
            Generate professional BPMN, UML Sequence, ERD, Flowchart, C4 and API docs from plain text.
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
        </div>

        {/* Hero diagram */}
        <div style={{ maxWidth: 900, margin: '60px auto 0', padding: '0 24px', position: 'relative', zIndex: 1 }}>
          <MorphingDiagram />
        </div>
      </section>

      {/* Diagram types */}
      <section style={{ padding: '80px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            {sectionTitle('Every diagram type you need')}
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

      {/* Pricing */}
      <section id="pricing" style={{ padding: '80px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            {sectionTitle('Simple, transparent pricing')}
          </div>
          <p style={{ textAlign: 'center', color: '#71717A', fontFamily: 'Inter, sans-serif', fontSize: 14, marginBottom: 48 }}>
            Annual billing available — save 2 months free.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
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
    </div>
  )
}
