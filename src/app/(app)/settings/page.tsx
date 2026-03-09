import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsPage } from '@/components/settings/SettingsPage'

export const metadata = {
  title: 'Settings — Flowmapr',
}

export default async function Settings() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const email = user.email ?? ''
  const fullName = (user.user_metadata?.full_name as string) ?? null

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, generations_used, monthly_limit, status, period_end')
    .eq('user_id', user.id)
    .single()

  return (
    <SettingsPage
      email={email}
      fullName={fullName}
      generationsUsed={sub?.generations_used ?? 0}
      monthlyLimit={sub?.monthly_limit ?? 5}
      plan={sub?.plan ?? 'free'}
      subscriptionStatus={sub?.status ?? null}
      subscriptionPeriodEnd={sub?.period_end ?? null}
    />
  )
}
