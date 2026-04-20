import { Resend } from 'resend'
import { getWelcomeHtml, getLimitReachedHtml } from './email-templates'

const FROM = 'Flowmapr Team <support@flowmapr.com>'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

export async function sendWelcomeEmail(to: string, fullName: string): Promise<void> {
  const resend = getResend()
  await resend.emails.send({
    from: FROM,
    to,
    subject: 'Welcome to Flowmapr 🎉',
    html: getWelcomeHtml(fullName),
  })
}

export async function sendLimitReachedEmail(to: string, fullName: string): Promise<void> {
  const resend = getResend()
  await resend.emails.send({
    from: FROM,
    to,
    subject: "You've used all your free diagrams",
    html: getLimitReachedHtml(fullName),
  })
}
