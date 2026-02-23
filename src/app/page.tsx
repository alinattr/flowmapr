import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Timer,
  Code2,
  CloudOff,
  FileText,
  Sparkles,
  Share2,
  Check,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-surface)]/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="text-xl font-semibold text-[var(--color-accent-brand)]"
        >
          flowmapr
        </Link>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/signup">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  )
}

function Hero() {
  return (
    <section className="flex flex-col items-center px-6 pb-[48px] pt-[64px]">
      <h1 className="max-w-2xl text-center text-[48px] font-bold leading-[1.1] tracking-tight text-[var(--color-text-primary)]">
        Turn requirements into diagrams.{' '}
        <span className="text-[var(--color-accent-brand)]">Instantly.</span>
      </h1>
      <p className="mt-6 max-w-lg text-center text-lg text-[var(--color-text-secondary)]">
        Describe a process in plain language — get a clean, editable BPMN or
        User Flow diagram in seconds. No code. No Visio. No moving boxes for 40
        minutes.
      </p>
      <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row">
        <Button size="lg" className="h-12 px-8 text-base" asChild>
          <Link href="/signup">Try free — no credit card required</Link>
        </Button>
        <Button variant="outline" size="lg" className="h-12 px-8 text-base" asChild>
          <a href="#how-it-works">See how it works</a>
        </Button>
      </div>
      <div className="mt-16 w-full max-w-4xl overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]">
        <div className="flex items-center gap-2 border-b border-[var(--color-border)] px-4 py-3">
          <div className="h-3 w-3 rounded-full bg-[var(--color-border)]" />
          <div className="h-3 w-3 rounded-full bg-[var(--color-border)]" />
          <div className="h-3 w-3 rounded-full bg-[var(--color-border)]" />
        </div>
        <div className="flex h-80 items-center justify-center bg-[var(--color-surface-raised)]">
          <div className="flex flex-col items-center gap-3 text-[var(--color-text-disabled)]">
            <FileText className="h-12 w-12" strokeWidth={1} />
            <span className="text-sm">Demo screenshot placeholder</span>
          </div>
        </div>
      </div>
    </section>
  )
}

const problems = [
  {
    icon: Timer,
    title: 'Draw.io takes forever',
    description:
      'Dragging boxes, aligning arrows, fixing layouts — 2 hours for one diagram that should take 2 minutes.',
  },
  {
    icon: Code2,
    title: 'Eraser is built for developers',
    description:
      'Great tool, wrong audience. Business analysts need BPMN and flows, not architecture diagrams.',
  },
  {
    icon: CloudOff,
    title: "ChatGPT can't save your work",
    description:
      'AI can generate a diagram description, but you can\'t edit it, share it, or export a proper PDF.',
  },
]

function Problem() {
  return (
    <section className="bg-[var(--color-surface)] py-[48px]">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-[30px] font-semibold text-[var(--color-text-primary)]">
          Diagramming shouldn&apos;t be this painful
        </h2>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {problems.map((p) => (
            <div
              key={p.title}
              className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-accent-subtle)]">
                <p.icon className="h-5 w-5 text-[var(--color-accent-brand)]" strokeWidth={1.5} />
              </div>
              <h3 className="mt-4 text-base font-medium text-[var(--color-text-primary)]">
                {p.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {p.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const steps = [
  {
    number: '1',
    title: 'Describe your process',
    description:
      'Write what happens in plain English. No special syntax, no code — just describe the flow.',
  },
  {
    number: '2',
    title: 'AI builds the diagram',
    description:
      'Flowmapr generates a clean, properly structured BPMN or User Flow diagram in seconds.',
  },
  {
    number: '3',
    title: 'Edit, share, export',
    description:
      'Drag nodes to rearrange, share a read-only link with your team, or export to PNG/PDF.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="py-[48px]">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-[30px] font-semibold text-[var(--color-text-primary)]">
          How it works
        </h2>
        <div className="mt-12 grid gap-10 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.number} className="flex flex-col items-center text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-accent-brand)] text-sm font-semibold text-white">
                {s.number}
              </div>
              <h3 className="mt-4 text-base font-medium text-[var(--color-text-primary)]">
                {s.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {s.description}
              </p>
              <div className="mt-6 w-full overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)]">
                <div className="flex h-48 items-center justify-center">
                  <span className="text-xs text-[var(--color-text-disabled)]">
                    Screenshot placeholder
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const plans = [
  {
    name: 'Free Trial',
    price: '$0',
    period: '',
    description: 'Try it out — no commitment',
    highlight: false,
    features: [
      '2 AI generations (lifetime)',
      'Up to 5 diagrams',
      'Export PNG / PDF',
      'Public sharing',
    ],
    cta: 'Get started',
    href: '/signup',
  },
  {
    name: 'Basic',
    price: '$12',
    period: '/mo',
    description: 'For individuals who diagram regularly',
    highlight: true,
    features: [
      '100 AI generations / month',
      'Up to 50 diagrams',
      'Export PNG / PDF',
      'Public sharing',
      'Upload doc as context',
    ],
    cta: 'Get started',
    href: '/signup',
  },
  {
    name: 'Pro',
    price: '$30',
    period: '/mo',
    description: 'For power users and teams',
    highlight: false,
    features: [
      '500 AI generations / month',
      'Unlimited diagrams',
      'Export PNG / PDF',
      'Public sharing',
      'Upload doc as context',
      'Version history (coming soon)',
    ],
    cta: 'Get started',
    href: '/signup',
  },
]

function Pricing() {
  return (
    <section className="bg-[var(--color-surface)] py-[48px]">
      <div className="mx-auto max-w-6xl px-6">
        <h2 className="text-center text-[30px] font-semibold text-[var(--color-text-primary)]">
          Simple, transparent pricing
        </h2>
        <p className="mt-3 text-center text-sm text-[var(--color-text-secondary)]">
          Annual billing available — save 2 months free.
        </p>
        <div className="mt-12 grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex flex-col rounded-xl border p-6 ${
                plan.highlight
                  ? 'border-[var(--color-accent-brand)] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]'
                  : 'border-[var(--color-border)]'
              } bg-[var(--color-surface)]`}
            >
              {plan.highlight && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-accent-brand)] text-white hover:bg-[var(--color-accent-brand)]">
                  Most popular
                </Badge>
              )}
              <h3 className="text-base font-medium text-[var(--color-text-primary)]">
                {plan.name}
              </h3>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-[30px] font-semibold text-[var(--color-text-primary)]">
                  {plan.price}
                </span>
                {plan.period && (
                  <span className="text-sm text-[var(--color-text-secondary)]">
                    {plan.period}
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                {plan.description}
              </p>
              <Separator className="my-6" />
              <ul className="flex flex-1 flex-col gap-3">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-success)]" strokeWidth={1.5} />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                className="mt-8 w-full"
                variant={plan.highlight ? 'default' : 'outline'}
                asChild
              >
                <Link href={plan.href}>
                  {plan.cta}
                  <ArrowRight className="ml-2 h-4 w-4" strokeWidth={1.5} />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

const faqItems = [
  {
    question: 'What types of diagrams can I create?',
    answer:
      'Flowmapr supports BPMN 2.0 diagrams (tasks, gateways, events, pools, lanes) and User Flow / Journey Maps. More diagram types are planned for future releases.',
  },
  {
    question: 'How do AI generation credits work?',
    answer:
      'Each time you generate a diagram from a text prompt, it uses 1 credit. Re-prompting an existing diagram also costs 1 credit. Credits reset monthly on your billing anniversary date. Free trial credits (2) are a lifetime allowance.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer:
      'Yes. You can cancel anytime from your account settings. You\'ll keep access to your paid features until the end of your current billing period, then your account reverts to Free Trial limits.',
  },
  {
    question: 'Is my data private and secure?',
    answer:
      'Yes. Your diagrams are private by default and only visible to you. You can optionally create a public read-only link to share specific diagrams. We use Supabase with row-level security so users can only access their own data.',
  },
  {
    question: 'What happens when I run out of credits?',
    answer:
      'You can still view, edit, and export your existing diagrams. You just won\'t be able to generate new diagrams from text prompts until your credits reset or you upgrade your plan.',
  },
]

function FAQ() {
  return (
    <section className="py-[48px]">
      <div className="mx-auto max-w-2xl px-6">
        <h2 className="text-center text-[30px] font-semibold text-[var(--color-text-primary)]">
          Frequently asked questions
        </h2>
        <Accordion type="single" collapsible className="mt-10">
          {faqItems.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm font-medium text-[var(--color-text-primary)]">
                {item.question}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
                {item.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-6 sm:flex-row sm:justify-between">
        <span className="text-base font-semibold text-[var(--color-accent-brand)]">
          flowmapr
        </span>
        <div className="flex gap-6 text-sm text-[var(--color-text-secondary)]">
          <a href="#" className="transition-colors hover:text-[var(--color-text-primary)]">
            Privacy Policy
          </a>
          <a href="#" className="transition-colors hover:text-[var(--color-text-primary)]">
            Terms of Service
          </a>
        </div>
        <span className="text-xs text-[var(--color-text-disabled)]">
          &copy; {new Date().getFullYear()} Flowmapr. All rights reserved.
        </span>
      </div>
    </footer>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <Navbar />
      <Hero />
      <Problem />
      <HowItWorks />
      <Pricing />
      <FAQ />
      <Footer />
    </div>
  )
}
