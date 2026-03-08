import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Workspace — Flowmapr',
}

export default async function WorkspacePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: defaultProject } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .single()

  if (defaultProject) {
    redirect(`/workspace/project/${defaultProject.id}`)
  }

  // Fallback: no default project yet (edge case for very new accounts)
  redirect('/login')
}
