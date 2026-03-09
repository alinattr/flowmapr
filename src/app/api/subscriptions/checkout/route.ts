import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPolarClient, getPolarOrganizationId, getPolarServer } from '@/lib/polar/client'

type CheckoutBody = {
  plan?: 'basic' | 'pro'
  userId?: string
}

function getProductId(plan: 'basic' | 'pro'): string | null {
  if (plan === 'basic') return process.env.POLAR_BASIC_PRODUCT_ID ?? null
  return process.env.POLAR_PRO_PRODUCT_ID ?? null
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: CheckoutBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 })
  }

  if (!body.userId || body.userId !== user.id) {
    return NextResponse.json({ error: 'Invalid userId.' }, { status: 403 })
  }
  if (body.plan !== 'basic' && body.plan !== 'pro') {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
  }

  const productId = getProductId(body.plan)
  const accessToken = process.env.POLAR_ACCESS_TOKEN?.trim() ?? ''
  if (!productId || accessToken.length === 0) {
    return NextResponse.json({ error: 'Polar is not configured.' }, { status: 500 })
  }
  const polar = createPolarClient()
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  const organizationId = getPolarOrganizationId()

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      successUrl: `${origin}/settings?billing=success`,
      metadata: {
        userId: user.id,
        plan: body.plan,
        ...(organizationId ? { organizationId } : {}),
      },
      externalCustomerId: user.id,
    })
    const checkoutUrl = checkout.url
    if (!checkoutUrl) {
      return NextResponse.json({ error: 'Checkout URL missing from Polar response.' }, { status: 502 })
    }
    return NextResponse.json({ checkoutUrl })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Polar error'
    if (message.toLowerCase().includes('invalid_token') || message.toLowerCase().includes('unauthorized')) {
      return NextResponse.json(
        {
          error: `Polar access token is invalid for ${getPolarServer()} environment. Verify POLAR_ACCESS_TOKEN${organizationId ? ` for org ${organizationId}` : ''}.`,
        },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: 'Failed to create checkout session.', details: message }, { status: 502 })
  }
}
