import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, status')
    .eq('user_id', user.id)
    .maybeSingle()

  const hasActivePaid = !!sub && (sub.plan === 'basic' || sub.plan === 'pro') && sub.status !== 'canceled'
  if (hasActivePaid) {
    return NextResponse.json(
      { error: 'Cancel your subscription before deleting your account.' },
      { status: 409 }
    )
  }

  const admin = createAdminClient()
  // 1) Delete user-owned content
  await admin.from('diagrams').delete().eq('user_id', user.id)
  await admin.from('subscriptions').delete().eq('user_id', user.id)
  await admin.from('profiles').delete().eq('id', user.id)

  // 2) Delete auth user
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    )
  }

  return NextResponse.json({ success: true })
}
