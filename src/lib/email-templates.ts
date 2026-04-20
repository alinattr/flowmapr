const BASE_STYLES = `
  font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  background-color: #09090B;
  color: #E4E4E7;
  margin: 0;
  padding: 0;
`

const CONTAINER = `
  max-width: 560px;
  margin: 40px auto;
  background-color: #09090B;
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 12px;
  overflow: hidden;
`

const HEADER_GRADIENT = `
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  padding: 32px 40px;
`

const BODY = `
  padding: 32px 40px;
`

const H1 = `
  font-size: 22px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px;
  line-height: 1.3;
`

const LOGO = `
  font-size: 18px;
  font-weight: 700;
  color: #ffffff;
  letter-spacing: -0.3px;
  margin: 0 0 16px;
`

const SUBHEADING = `
  font-size: 14px;
  color: rgba(255,255,255,0.75);
  margin: 0;
  line-height: 1.5;
`

const P = `
  font-size: 15px;
  color: #A1A1AA;
  line-height: 1.7;
  margin: 0 0 20px;
`

const P_HIGHLIGHT = `
  font-size: 15px;
  color: #E4E4E7;
  line-height: 1.7;
  margin: 0 0 20px;
`

const CTA_BUTTON = (href: string, label: string) => `
  <a href="${href}" style="
    display: inline-block;
    background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
    color: #ffffff;
    font-size: 14px;
    font-weight: 600;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 8px;
    margin: 8px 0 24px;
    letter-spacing: 0.1px;
  ">${label}</a>
`

const DIVIDER = `
  <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.07); margin: 24px 0;" />
`

const FOOTER_TEXT = `
  font-size: 12px;
  color: #52525B;
  line-height: 1.6;
  margin: 0;
`

const PROMPT_CARD = (text: string) => `
  <div style="
    background: rgba(99,102,241,0.08);
    border: 1px solid rgba(99,102,241,0.2);
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 8px;
    font-size: 13px;
    color: #A5B4FC;
    line-height: 1.5;
  ">"${text}"</div>
`

function wrap(inner: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Flowmapr</title>
</head>
<body style="${BASE_STYLES}">
  <div style="${CONTAINER}">
    ${inner}
    <div style="padding: 20px 40px 28px; border-top: 1px solid rgba(255,255,255,0.06);">
      <p style="${FOOTER_TEXT}">
        You received this email because you created a Flowmapr account.<br />
        <a href="https://www.flowmapr.com" style="color: #52525B;">flowmapr.com</a>
      </p>
    </div>
  </div>
</body>
</html>`
}

export function getWelcomeHtml(fullName: string): string {
  const name = fullName || 'there'
  return wrap(`
    <div style="${HEADER_GRADIENT}">
      <p style="${LOGO}">✦ Flowmapr</p>
      <h1 style="${H1}">Welcome aboard, ${name}! 🎉</h1>
      <p style="${SUBHEADING}">You're all set. Let's build your first diagram.</p>
    </div>
    <div style="${BODY}">
      <p style="${P_HIGHLIGHT}">
        Hi ${name}, thanks for joining Flowmapr! You have <strong style="color: #818CF8;">3 free AI generations</strong> to try — no credit card needed.
      </p>
      <p style="${P}">
        Just describe a process in plain English and get a clean, editable diagram in seconds. Try one of these prompts to get started:
      </p>
      ${PROMPT_CARD('A customer onboarding process with email verification and KYC check')}
      ${PROMPT_CARD('User login flow with password reset and two-factor authentication')}
      ${PROMPT_CARD('Order fulfillment process from checkout to delivery confirmation')}
      <p style="${P} margin-top: 16px;">
        Head to your workspace and paste any of the above — or describe your own process.
      </p>
      ${CTA_BUTTON('https://www.flowmapr.com/workspace', 'Generate your first diagram →')}
      ${DIVIDER}
      <p style="${P}">
        If you have any questions, just reply to this email — I read every message personally.
      </p>
      <p style="${P_HIGHLIGHT}">— Flowmapr Team</p>
    </div>
  `)
}

export function getLimitReachedHtml(fullName: string): string {
  const name = fullName || 'there'
  return wrap(`
    <div style="${HEADER_GRADIENT}">
      <p style="${LOGO}">✦ Flowmapr</p>
      <h1 style="${H1}">You've used all 3 free diagrams</h1>
      <p style="${SUBHEADING}">Upgrade to keep going — no limits on creativity.</p>
    </div>
    <div style="${BODY}">
      <p style="${P_HIGHLIGHT}">
        Hi ${name}, you've used all your free AI generations. Hope Flowmapr has been useful so far!
      </p>
      <p style="${P}">
        Upgrade to <strong style="color: #E4E4E7;">Basic for $15/mo</strong> and unlock:
      </p>
      <ul style="padding-left: 20px; margin: 0 0 20px;">
        <li style="font-size: 15px; color: #A1A1AA; line-height: 2;">100 AI diagram generations / month</li>
        <li style="font-size: 15px; color: #A1A1AA; line-height: 2;">API Lens — architecture diagrams from OpenAPI specs</li>
        <li style="font-size: 15px; color: #A1A1AA; line-height: 2;">Export PNG / PDF</li>
        <li style="font-size: 15px; color: #A1A1AA; line-height: 2;">Explain Diagram (AI)</li>
        <li style="font-size: 15px; color: #A1A1AA; line-height: 2;">Update Diagram with AI</li>
        <li style="font-size: 15px; color: #A1A1AA; line-height: 2;">Version History (last 20)</li>
        <li style="font-size: 15px; color: #A1A1AA; line-height: 2;">Public sharing</li>
      </ul>
      ${CTA_BUTTON('https://www.flowmapr.com/settings', 'Upgrade to Basic — $15/mo →')}
      ${DIVIDER}
      <p style="${P}">
        Questions? Just reply — I'm happy to help.
      </p>
      <p style="${P_HIGHLIGHT}">— Flowmapr Team</p>
    </div>
  `)
}
