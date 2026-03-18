import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPolarClient } from '@/lib/polar/client'

export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const { data: sub, error: subError } = await supabase
    .from('subscriptions')
    .select('polar_customer_id, polar_subscription_id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (subError) {
    return NextResponse.json({ error: 'failed_to_load_subscription' }, { status: 500 })
  }

  if (!sub?.polar_customer_id) {
    return NextResponse.json({ invoices: [] })
  }

  try {
    const polar = createPolarClient()
    const orders = await polar.orders.list({
      customerId: sub.polar_customer_id,
      limit: 10,
    })

    const items = orders.result.items ?? []
    const invoices = items.map((order: Record<string, unknown>) => ({
      id: String(order.id ?? ''),
      date: (order.createdAt as string | undefined) ?? (order.created_at as string | undefined) ?? new Date().toISOString(),
      amount:
        Number(
          (order.totalAmount as number | undefined) ??
            (order.total_amount as number | undefined) ??
            0
        ) / 100,
      currency: String(order.currency ?? '').toUpperCase(),
      status: String(order.status ?? 'unknown'),
      invoiceUrl:
        (order.invoiceUrl as string | undefined) ??
        (order.invoice_url as string | undefined) ??
        null,
    }))

    return NextResponse.json({ invoices })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'unknown_error'
    return NextResponse.json(
      { error: 'failed_to_load_invoices', details: message },
      { status: 502 }
    )
  }
}
