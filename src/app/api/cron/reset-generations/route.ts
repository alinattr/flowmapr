import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const admin = createAdminClient()
  const nowIso = new Date().toISOString()
  const nextMonthIso = new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()

  const { error } = await admin
    .from('subscriptions')
    .update({
      generations_used: 0,
      period_start: nowIso,
      period_end: nextMonthIso,
    })
    .eq('status', 'active')
    .lt('period_end', nowIso)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ ok: true })
}
