import { createAdminClient } from '@/lib/supabase/admin'
import { PLANS, normalizePlan, type PlanKey } from './plans'

interface UsageInput {
  userId: string
  diagramId?: string | null
  diagramType?: string | null
  tokensUsed?: number | null
}

function monthWindow() {
  const now = new Date()
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))
  return { start: start.toISOString(), end: end.toISOString() }
}

export async function recordGenerationUsage({
  userId,
  diagramId = null,
  diagramType = null,
  tokensUsed = null,
}: UsageInput): Promise<void> {
  const admin = createAdminClient()

  const { data: sub } = await admin
    .from('subscriptions')
    .select('plan, generations_used, monthly_limit, status')
    .eq('user_id', userId)
    .maybeSingle()

  const plan: PlanKey = sub?.status === 'active' ? normalizePlan(sub?.plan) : 'free'
  const limit = Number(sub?.monthly_limit ?? PLANS[plan].generation_limit)
  const currentUsed = Number(sub?.generations_used ?? 0)

  if (sub) {
    await admin
      .from('subscriptions')
      .update({ generations_used: currentUsed + 1 })
      .eq('user_id', userId)
  } else {
    const { start, end } = monthWindow()
    await admin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        plan,
        status: 'active',
        monthly_limit: limit,
        generations_used: 1,
        period_start: start,
        period_end: end,
      }, { onConflict: 'user_id' })
  }

  await admin.from('generation_log').insert({
    user_id: userId,
    diagram_id: diagramId,
    diagram_type: diagramType,
    tokens_used: tokensUsed,
  })
}
