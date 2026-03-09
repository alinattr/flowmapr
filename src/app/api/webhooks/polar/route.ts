import { NextResponse } from 'next/server'
import { validateEvent, WebhookVerificationError } from '@polar-sh/sdk/webhooks'
import * as Sentry from '@sentry/nextjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { PLANS, normalizePlan, type PlanKey } from '@/lib/subscriptions/plans'

type PolarPayload = {
  type?: string
  data?: Record<string, unknown>
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function getUserId(data: Record<string, unknown>): string | null {
  const customer = (data.customer as Record<string, unknown> | undefined) ?? {}
  const metadata = (data.metadata as Record<string, unknown> | undefined) ?? {}
  const customerMeta = (customer.metadata as Record<string, unknown> | undefined) ?? {}

  return (
    asString(metadata.userId) ??
    asString(metadata.user_id) ??
    asString(customer.external_id) ??
    asString(customerMeta.userId) ??
    asString(customerMeta.user_id) ??
    asString(data.user_id)
  )
}

function getCustomerEmail(data: Record<string, unknown>): string | null {
  const customer = (data.customer as Record<string, unknown> | undefined) ?? {}
  return (
    asString(customer.email) ??
    asString(data.customer_email) ??
    asString((data.user as Record<string, unknown> | undefined)?.['email'])
  )
}

function getPolarCustomerId(data: Record<string, unknown>): string | null {
  const customer = (data.customer as Record<string, unknown> | undefined) ?? {}
  return (
    asString(data.customer_id) ??
    asString(data.customerId) ??
    asString(customer.id)
  )
}

function resolvePlan(data: Record<string, unknown>): PlanKey {
  const basicId = process.env.POLAR_BASIC_PRODUCT_ID
  const proId = process.env.POLAR_PRO_PRODUCT_ID
  const productId =
    asString(data.product_id) ??
    asString((data.product as Record<string, unknown> | undefined)?.id) ??
    asString((data.price as Record<string, unknown> | undefined)?.product_id)

  const rawPlan = normalizePlan(asString(data.plan))
  if (rawPlan !== 'free') return rawPlan
  if (productId && proId && productId === proId) return 'pro'
  if (productId && basicId && productId === basicId) return 'basic'
  if (productId?.toLowerCase().includes('pro')) return 'pro'
  if (productId?.toLowerCase().includes('basic')) return 'basic'
  return 'free'
}

function getPeriod(data: Record<string, unknown>) {
  const periodStart =
    asString(data.period_start) ??
    asString(data.current_period_start) ??
    new Date().toISOString()
  const periodEnd =
    asString(data.period_end) ??
    asString(data.current_period_end) ??
    new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString()
  return { periodStart, periodEnd }
}

export async function POST(req: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'POLAR_WEBHOOK_SECRET is not configured' }, { status: 500 })
  }

  const rawBody = await req.text()

  let payload: PolarPayload
  try {
    const headers = Object.fromEntries(req.headers.entries())
    payload = validateEvent(rawBody, headers, secret) as PolarPayload
  } catch (error) {
    if (error instanceof WebhookVerificationError) {
      Sentry.captureException(error, {
        tags: { webhook: 'polar', event: 'signature_error' },
      })
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
    console.log(
      '[polar webhook] unknown event type, skipping:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json({ received: true }, { status: 200 })
  }

  const eventType = payload.type ?? ''
  const data = (payload.data ?? {}) as Record<string, unknown>
  const rawUserId = getUserId(data)
  const directUserId = rawUserId && isUuid(rawUserId) ? rawUserId : null
  const customerEmail = getCustomerEmail(data)
  const productId =
    asString(data.product_id) ??
    asString((data.product as Record<string, unknown> | undefined)?.id) ??
    asString((data.price as Record<string, unknown> | undefined)?.product_id)

  console.log('[polar webhook] received:', eventType)
  console.log('[polar webhook] customer email:', customerEmail ?? 'n/a')
  console.log('[polar webhook] product id:', productId ?? 'n/a')
  if (rawUserId && !directUserId) {
    console.log('[polar webhook] ignoring non-uuid user id candidate:', rawUserId)
  }

  const admin = createAdminClient()

  let userId = directUserId
  if (userId) {
    const directProfile = await admin
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    if (directProfile.error) {
      console.error('[polar webhook] direct user id profile lookup failed:', directProfile.error)
    } else if (!directProfile.data) {
      console.log('[polar webhook] direct user id has no profile row, will try email fallback')
      userId = null
    }
  }

  if (!userId && customerEmail) {
    let profileRes = await admin
      .from('profiles')
      .select('id')
      .eq('email', customerEmail)
      .maybeSingle()

    if (!profileRes.error && !profileRes.data) {
      // Fallback for case differences in email value from provider.
      profileRes = await admin
        .from('profiles')
        .select('id')
        .ilike('email', customerEmail)
        .maybeSingle()
    }

    if (profileRes.error) {
      console.error('[polar webhook] user lookup by email failed:', profileRes.error)
    } else {
      userId = asString(profileRes.data?.id)
    }
  }

  if (!userId) {
    Sentry.captureMessage(`[polar webhook] user not found: ${eventType}`, {
      level: 'warning',
      extra: { customerEmail, directUserId, eventType },
    })
    console.error('[polar webhook] user not found for event', eventType, {
      customerEmail,
      directUserId,
    })
    return NextResponse.json({ ok: true, ignored: 'missing_user_id' }, { status: 200 })
  }

  const plan = resolvePlan(data)
  const { periodStart, periodEnd } = getPeriod(data)
  const monthlyLimit = PLANS[plan].generation_limit
  const polarCustomerId = asString(data.customer_id) ?? getPolarCustomerId(data)
  const subscriptionId =
    asString(data.subscription_id) ??
    asString(data.id)
  const status = asString(data.status) ?? 'active'

  console.log('[polar webhook] mapped plan:', plan)

  switch (eventType) {
    case 'subscription.created':
    case 'subscription.active': {
      let matchedBySubscription = false

      if (subscriptionId) {
        const updateBySubscriptionId = await admin
          .from('subscriptions')
          .update({
            plan,
            status: 'active',
            polar_customer_id: polarCustomerId,
            monthly_limit: monthlyLimit,
            period_start: periodStart,
            period_end: periodEnd,
          })
          .eq('polar_subscription_id', subscriptionId)
          .select('user_id')

        if (updateBySubscriptionId.error) {
          console.error('[polar webhook] subscriptions update by polar_subscription_id error:', updateBySubscriptionId.error)
          Sentry.captureException(updateBySubscriptionId.error, {
            tags: { webhook: 'polar', event: eventType },
            extra: { userId, plan, subscriptionId, step: 'update_by_subscription_id' },
          })
        } else {
          matchedBySubscription = (updateBySubscriptionId.data?.length ?? 0) > 0
        }
      }

      if (!matchedBySubscription) {
        const upsertRes = await admin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan,
            status: 'active',
            polar_subscription_id: subscriptionId,
            polar_customer_id: polarCustomerId,
            monthly_limit: monthlyLimit,
            generations_used: 0,
            period_start: periodStart,
            period_end: periodEnd,
          }, { onConflict: 'user_id' })
        if (upsertRes.error) {
          console.error('[polar webhook] subscriptions upsert error:', upsertRes.error)
          Sentry.captureException(upsertRes.error, {
            tags: { webhook: 'polar', event: eventType },
            extra: { userId, plan, subscriptionId },
          })
        }
      }
      break
    }
    case 'subscription.updated': {
      const updateRes = await admin
        .from('subscriptions')
        .update({
          plan,
          status,
          polar_subscription_id: subscriptionId,
          polar_customer_id: polarCustomerId,
          period_end: periodEnd,
          monthly_limit: monthlyLimit,
        })
        .eq('user_id', userId)
      if (updateRes.error) {
        console.error('[polar webhook] subscriptions update error:', updateRes.error)
        const upsertRes = await admin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan,
            status,
            polar_subscription_id: subscriptionId,
            polar_customer_id: polarCustomerId,
            monthly_limit: monthlyLimit,
            period_start: periodStart,
            period_end: periodEnd,
          }, { onConflict: 'user_id' })
        if (upsertRes.error) {
          console.error('[polar webhook] subscriptions update fallback upsert error:', upsertRes.error)
          Sentry.captureException(upsertRes.error, {
            tags: { webhook: 'polar', event: eventType },
            extra: { userId, plan, subscriptionId },
          })
        }
      }
      break
    }
    case 'subscription.canceled': {
      const cancelRes = await admin
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('user_id', userId)
      if (cancelRes.error) {
        console.error('[polar webhook] subscriptions cancel update error:', cancelRes.error)
      }
      break
    }
    case 'subscription.uncanceled': {
      const uncancelRes = await admin
        .from('subscriptions')
        .update({
          status: 'active',
          cancel_at_period_end: false,
        })
        .eq('polar_subscription_id', subscriptionId)

      if (uncancelRes.error) {
        console.error('[polar webhook] subscription.uncanceled update error:', uncancelRes.error)
      }

      console.log(`[polar webhook] subscription reactivated: ${subscriptionId}`)
      break
    }
    case 'invoice.paid': {
      const invoiceRes = await admin
        .from('subscriptions')
        .update({
          generations_used: 0,
          period_start: periodStart,
          period_end: periodEnd,
          status: 'active',
        })
        .eq('user_id', userId)
      if (invoiceRes.error) {
        console.error('[polar webhook] invoice.paid subscriptions update error:', invoiceRes.error)
        const upsertRes = await admin
          .from('subscriptions')
          .upsert({
            user_id: userId,
            plan,
            status: 'active',
            polar_subscription_id: subscriptionId,
            polar_customer_id: polarCustomerId,
            monthly_limit: monthlyLimit,
            generations_used: 0,
            period_start: periodStart,
            period_end: periodEnd,
          }, { onConflict: 'user_id' })
        if (upsertRes.error) {
          console.error('[polar webhook] invoice.paid fallback upsert error:', upsertRes.error)
          Sentry.captureException(upsertRes.error, {
            tags: { webhook: 'polar', event: eventType },
            extra: { userId, plan, subscriptionId },
          })
        }
      }
      break
    }
    case 'subscription.revoked': {
      const revokedSubscriptionId =
        asString(data.subscription_id) ??
        asString(data.id)

      let revokeRes = null
      if (revokedSubscriptionId) {
        revokeRes = await admin
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'active',
            monthly_limit: 3,
            generations_used: 0,
            polar_subscription_id: null,
            polar_customer_id: null,
          })
          .eq('polar_subscription_id', revokedSubscriptionId)
      }

      // Fallback by user_id when payload doesn't include usable subscription id.
      if (!revokeRes || revokeRes.error) {
        revokeRes = await admin
          .from('subscriptions')
          .update({
            plan: 'free',
            status: 'active',
            monthly_limit: 3,
            generations_used: 0,
            polar_subscription_id: null,
            polar_customer_id: null,
          })
          .eq('user_id', userId)
      }
      if (revokeRes.error) {
        console.error('[polar webhook] subscription.revoked update error:', revokeRes.error)
      }
      break
    }
    case 'order.created':
    case 'order.updated':
    case 'order.paid':
    case 'order.refunded':
    case 'refund.created':
    case 'refund.updated':
    case 'checkout.created':
    case 'checkout.updated':
      Sentry.captureMessage(`[polar webhook] ignored: ${eventType}`, {
        level: 'info',
        extra: {
          customerEmail,
          productId: productId ?? 'n/a',
          eventType,
        },
      })
      break
    case 'customer.created':
    case 'customer.updated':
    case 'customer.state_changed':
    case 'organization.updated':
      console.log(`[polar webhook] ignored event: ${eventType}`)
      break
    default:
      console.log('[polar webhook] unhandled event type:', eventType)
  }

  return NextResponse.json({ ok: true })
}
