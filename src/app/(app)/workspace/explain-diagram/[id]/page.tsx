import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import { ExplainDiagramDetailShell } from '@/components/workspace/ExplainDiagramDetailShell'

interface Props {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from('artifacts').select('title').eq('id', id).single()
  return { title: data ? `${data.title} — Flowmapr` : 'Explanation — Flowmapr' }
}

export default async function ExplainDiagramDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: artifact } = await supabase
    .from('artifacts')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (!artifact || artifact.type !== 'explain_diagram') notFound()

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('plan, generations_used, monthly_limit')
    .eq('user_id', user.id)
    .single()

  return (
    <ExplainDiagramDetailShell
      email={user.email ?? ''}
      fullName={(user.user_metadata?.full_name as string) ?? null}
      plan={sub?.plan ?? 'free'}
      generationsRemaining={sub ? sub.monthly_limit - sub.generations_used : 2}
      artifact={artifact}
    />
  )
}
