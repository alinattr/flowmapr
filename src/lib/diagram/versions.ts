import { createClient } from '@/lib/supabase/client'

const MAX_VERSIONS = 20

export async function saveVersion(
  diagramId: string,
  snapshot: Record<string, unknown>,
  label?: string
): Promise<void> {
  const supabase = createClient()

  await supabase.from('diagram_versions').insert({
    diagram_id: diagramId,
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
