import { createAdminClient } from '@/lib/supabase/admin'
import { PLANS, normalizePlan } from './plans'

export async function hasFeature(userId: string, feature: string): Promise<boolean> {
  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('plan, status, period_end')
    .eq('user_id', userId)
    .maybeSingle()

  const normalizedPlan = normalizePlan(sub?.plan)
  // Paid plans keep access during cancel_at_period_end window.
  // Downgrade is applied by webhook (subscription.revoked) when period actually ends.
  const effectivePlan = normalizedPlan === 'basic' || normalizedPlan === 'pro'
    ? normalizedPlan
    : 'free'

  return PLANS[effectivePlan].features.includes(feature as never)
}
