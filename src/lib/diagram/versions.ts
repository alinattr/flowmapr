import { createClient } from '@/lib/supabase/client'

const MAX_VERSIONS = 20

export async function saveVersion(
  diagramId: string,
  snapshot: Record<string, unknown>,
  label?: string
): Promise<void> {
  const supabase = createClient()

  // user_id is required (NOT NULL) on diagram_versions; fetch from session
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  await supabase.from('diagram_versions').insert({
    diagram_id: diagramId,
    user_id: user.id,
    snapshot,
    label: label ?? null,
  })

  // Prune to MAX_VERSIONS per diagram
  const { data: all } = await supabase
    .from('diagram_versions')
    .select('id')
    .eq('diagram_id', diagramId)
    .order('created_at', { ascending: false })

  if (all && all.length > MAX_VERSIONS) {
    const toDelete = all.slice(MAX_VERSIONS).map((v: { id: string }) => v.id)
    await supabase.from('diagram_versions').delete().in('id', toDelete)
  }
}
