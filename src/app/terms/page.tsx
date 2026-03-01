import { LandingNav } from '@/components/landing/LandingNav'

export const metadata = {
  title: 'Terms of Use — Flowmapr',
}

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    content: 'By accessing or using Flowmapr, you agree to be bound by these Terms of Use. If you do not agree to these terms, please do not use our service.',
  },
  {
    title: '2. Description of Service',
    content: 'Flowmapr is an AI-powered diagram generation tool that allows users to create BPMN, UML Sequence, ERD, Flowchart, C4 Model, and API documentation diagrams from plain text descriptions.',
  },
  {
    title: '3. User Accounts',
    content: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use of your account. We reserve the right to terminate accounts that violate these terms.',
  },
  {
    title: '4. Acceptable Use',
    content: 'You agree not to use Flowmapr for any unlawful purpose or in any way that could damage, disable, or impair the service. You may not attempt to gain unauthorized access to any part of the service or its related systems.',
  },
  {
    title: '5. Intellectual Property',
    content: 'Diagrams you create using Flowmapr are owned by you. The Flowmapr platform, including its AI models, interface, and underlying technology, remains the property of Flowmapr and its licensors.',
  },
  {
    title: '6. Subscription and Payments',
    content: 'Paid plans are billed monthly or annually. Subscriptions automatically renew unless cancelled. Refunds are provided at our discretion within 7 days of purchase. We reserve the right to change pricing with 30 days notice.',
  },
  {
    title: '7. AI-Generated Content',
    content: 'Diagrams are generated using AI and may not always be accurate or complete. You are responsible for reviewing and validating all generated content before use in professional or critical contexts.',
  },
  {
    title: '8. Limitation of Liability',
    content: 'Flowmapr is provided "as is" without warranties of any kind. We are not liable for any indirect, incidental, or consequential damages arising from your use of the service.',
  },
  {
    title: '9. Changes to Terms',
    content: 'We may update these Terms of Use from time to time. Continued use of the service after changes constitutes acceptance of the new terms.',
  },
  {
    title: '10. Contact',
    content: 'For questions about these terms, please contact us at legal@flowmapr.com.',
  },
]

export default function TermsPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#09090B', color: '#E2E8F0' }}>
      <LandingNav />

      <div style={{
        maxWidth: 720,
        margin: '0 auto',
        padding: '120px 24px 80px',
        fontFamily: 'Inter, sans-serif',
      }}>
        <h1 style={{ fontSize: 36, fontWeight: 700, color: '#F8FAFC', marginBottom: 8 }}>
          Terms of Use
        </h1>
        <p style={{ fontSize: 13, color: '#52525B', marginBottom: 48 }}>
          Last updated: March 2025
        </p>

        {SECTIONS.map(section => (
          <div key={section.title} style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#C4B5FD', marginBottom: 10 }}>
              {section.title}
            </h2>
            <p style={{ fontSize: 14, color: '#94A3B8', lineHeight: 1.8 }}>
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
