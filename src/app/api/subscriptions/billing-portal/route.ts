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
    .select('plan, status, polar_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subError) {
    return NextResponse.json({ error: 'Failed to load subscription.' }, { status: 500 })
  }
  if (!subscription || (subscription.plan !== 'basic' && subscription.plan !== 'pro')) {
    return NextResponse.json({ error: 'Billing portal is available for paid plans only.' }, { status: 400 })
  }
  if (!subscription.polar_customer_id) {
    return NextResponse.json({ error: 'Missing Polar customer ID. Please contact support.' }, { status: 400 })
  }

  try {
    const polar = createPolarClient()
    const result = await (polar as unknown as {
      customerSessions: {
        create: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
      }
    }).customerSessions.create({
      customerId: subscription.polar_customer_id,
      customer_id: subscription.polar_customer_id,
    })

    const url =
      (typeof result.customer_portal_url === 'string' && result.customer_portal_url) ||
      (typeof result.customerPortalUrl === 'string' && result.customerPortalUrl) ||
      (typeof result.url === 'string' && result.url) ||
      null

    if (!url) {
      return NextResponse.json({ error: 'Customer portal URL missing from Polar response.' }, { status: 502 })
    }

    return NextResponse.json({ url })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Polar error'
    return NextResponse.json({ error: 'Failed to open billing portal.', details: message }, { status: 502 })
  }
}
