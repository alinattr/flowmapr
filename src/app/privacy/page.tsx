import { LandingNav } from '@/components/landing/LandingNav'

export const metadata = {
  title: 'Privacy Policy — Flowmapr',
}

const SECTIONS = [
  {
    title: '1. Information We Collect',
    content: 'We collect information you provide when creating an account (email, name), usage data (diagrams created, features used), and technical data (browser type, IP address, device information) to operate and improve our service.',
  },
  {
    title: '2. How We Use Your Information',
    content: 'We use your information to provide and improve the Flowmapr service, process payments, send service-related communications, analyze usage patterns to improve features, and comply with legal obligations.',
  },
  {
    title: '3. Your Diagram Data',
    content: 'Diagrams you create are stored securely and are only accessible to you (and team members you invite). We do not use your diagram content to train AI models without your explicit consent. You can export or delete your data at any time.',
  },
  {
    title: '4. AI Processing',
    content: 'Text prompts you enter are processed by our AI infrastructure to generate diagrams. These prompts may be temporarily retained to improve generation quality. We do not sell your prompts or diagram content to third parties.',
  },
  {
    title: '5. Data Sharing',
    content: 'We do not sell your personal data. We share data only with service providers necessary to operate Flowmapr (hosting, payment processing, analytics), and when required by law.',
  },
  {
    title: '6. Cookies',
    content: 'We use essential cookies for authentication and session management, and analytics cookies to understand how users interact with the service. You can disable non-essential cookies in your browser settings.',
  },
  {
    title: '7. Data Retention',
    content: 'We retain your account data as long as your account is active. Deleted accounts and their associated diagrams are permanently removed within 30 days. Anonymized usage analytics may be retained longer.',
  },
  {
    title: '8. Your Rights',
    content: 'You have the right to access, correct, or delete your personal data at any time from your account settings. For data requests or concerns, contact us at privacy@flowmapr.com.',
  },
  {
    title: '9. Security',
    content: 'We use industry-standard encryption (TLS) for data in transit and at rest. Access to user data is strictly limited to authorized personnel. We conduct regular security reviews.',
  },
  {
    title: '10. Changes to This Policy',
    content: 'We may update this Privacy Policy periodically. We will notify you of significant changes via email or a notice in the application.',
  },
  {
    title: '11. Contact Us',
    content: 'For privacy-related questions or requests, contact us at privacy@flowmapr.com.',
  },
]

export default function PrivacyPage() {
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
          Privacy Policy
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
