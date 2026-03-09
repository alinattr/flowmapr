import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPolarClient } from '@/lib/polar/client'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: subscription, error: subError } = await supabase
    .from('subscriptions')
    .select('plan, status, polar_subscription_id, period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subError) {
    return NextResponse.json({ error: 'Failed to load subscription.' }, { status: 500 })
  }
  if (!subscription) {
    return NextResponse.json({ error: 'Subscription not found.' }, { status: 404 })
  }
  if (subscription.plan !== 'basic' && subscription.plan !== 'pro') {
    return NextResponse.json({ error: 'No paid subscription to cancel.' }, { status: 400 })
  }
  if (!subscription.polar_subscription_id) {
    return NextResponse.json({ error: 'Missing Polar subscription ID.' }, { status: 400 })
  }

  try {
    const polar = createPolarClient()
    await polar.subscriptions.update({
      id: subscription.polar_subscription_id,
      subscriptionUpdate: { cancelAtPeriodEnd: true },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Polar error'
    return NextResponse.json({ error: 'Failed to cancel subscription in Polar.', details: message }, { status: 502 })
  }

  const { error: updateError } = await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('user_id', user.id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update subscription status.' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    periodEnd: subscription.period_end,
    plan: subscription.plan,
  })
}
