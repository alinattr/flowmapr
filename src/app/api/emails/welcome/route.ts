import { NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: Request) {
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.EMAIL_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  let body: { email?: string; full_name?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const { email, full_name } = body
  if (!email) {
    return NextResponse.json({ error: 'email_required' }, { status: 400 })
  }

  await sendWelcomeEmail(email, full_name ?? 'there')
  return NextResponse.json({ ok: true })
}
