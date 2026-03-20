import { createAdminClient } from '@/lib/supabase/admin'
import { PLANS, normalizePlan } from './plans'

export interface GenerationLimitCheck {
  allowed: boolean
  used: number
  limit: number
  plan: 'free' | 'basic' | 'pro'
}

function getMonthWindow(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0))
  const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0))
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function checkGenerationLimit(userId: string): Promise<GenerationLimitCheck> {
  const admin = createAdminClient()
  const { data: sub, error } = await admin
    .from('subscriptions')
    .select('plan, monthly_limit, generations_used')
    .eq('user_id', userId)
    .maybeSingle()

  console.log('[checkGenerationLimit] userId:', userId)
  console.log('[checkGenerationLimit] sub:', JSON.stringify(sub))
  console.log('[checkGenerationLimit] error:', error)

  const plan = normalizePlan(sub?.plan)
  const limit = Number(sub?.monthly_limit ?? PLANS[plan].generation_limit)

  let used = Number(sub?.generations_used ?? 0)

  console.log('[checkGenerationLimit] plan:', plan, 'limit:', limit, 'used:', used)
  console.log('[checkGenerationLimit] allowed:', used < limit)

  // No subscription row yet: enforce Free via generation_log count.
  if (!sub) {
    const { start, end } = getMonthWindow()
    const { count } = await admin
      .from('generation_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', start)
      .lt('created_at', end)
    used = count ?? 0
    console.log('[checkGenerationLimit] fallback generation_log count used:', used)
  }

  return {
    allowed: used < limit,
    used,
    limit,
    plan,
  }
}
