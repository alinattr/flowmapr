import { createClient } from '@/lib/supabase/client'
import type { Folder } from '@/types/diagram'

export async function createFolder(name: string, color: string = '#6366F1'): Promise<Folder | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('folders')
    .insert({ name, color })
    .select()
    .single()
  if (error) { console.error(error); return null }
  return data as Folder
}

export async function getFolders(): Promise<Folder[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) { console.error(error); return [] }
  return (data ?? []) as Folder[]
}

export async function deleteFolder(id: string): Promise<boolean> {
  const supabase = createClient()
  // Unlink diagrams first
  await supabase.from('diagrams').update({ folder_id: null }).eq('folder_id', id)
  const { error } = await supabase.from('folders').delete().eq('id', id)
  return !error
}

export async function renameFolder(id: string, name: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('folders').update({ name }).eq('id', id)
  return !error
}

export async function updateFolderColor(id: string, color: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase.from('folders').update({ color }).eq('id', id)
  return !error
}

export async function moveDiagramToFolder(diagramId: string, folderId: string | null): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('diagrams')
    .update({ folder_id: folderId })
    .eq('id', diagramId)
  return !error
}
