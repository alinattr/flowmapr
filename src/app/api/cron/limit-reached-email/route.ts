import { NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendLimitReachedEmail } from '@/lib/email'

export async function GET(req: Request) {
  if (req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Step 1: get eligible subscriptions (two-step to avoid FK join uncertainty)
  const { data: subs } = await admin
    .from('subscriptions')
    .select('user_id')
    .eq('plan', 'free')
    .eq('status', 'active')
    .gte('generations_used', 3)
    .is('limit_email_sent_at', null)

  let sent = 0

  for (const sub of subs ?? []) {
    const { data: profile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', sub.user_id)
      .single()

    if (!profile?.email) continue

    try {
      await sendLimitReachedEmail(profile.email, profile.full_name ?? 'there')
      // Only stamp if email succeeded
      await admin
        .from('subscriptions')
        .update({ limit_email_sent_at: new Date().toISOString() })
        .eq('user_id', sub.user_id)
      sent++
    } catch (err) {
      Sentry.captureException(err, {
        tags: { context: 'limit_email', userId: sub.user_id },
      })
    }
  }

  return NextResponse.json({ sent })
}
