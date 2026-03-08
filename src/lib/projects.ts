/**
 * projects.ts — client-side data access helpers for the projects system.
 * Use these in client components; for server components use the server Supabase client directly.
 */
import { createClient } from '@/lib/supabase/client'
import type { Project, Artifact, DiagramSummary } from '@/types/diagram'

/** RLS on the projects table filters to the current authenticated user automatically. */
export async function getUserProjects(): Promise<Project[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) {
    console.warn('[projects] getUserProjects error:', error.message)
    return []
  }
  return (data ?? []) as Project[]
}

export async function getProjectDiagrams(projectId: string): Promise<DiagramSummary[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('diagrams')
    .select('id, title, diagram_type, updated_at, created_at, preview_svg, folder_id, public_slug, project_id')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false })
    .limit(20)
  if (error) {
    console.warn('[projects] getProjectDiagrams error:', error.message)
    return []
  }
  return (data ?? []) as DiagramSummary[]
}

/** RLS filters diagrams to the current authenticated user automatically. */
export async function getRecentDiagrams(limit = 5): Promise<DiagramSummary[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('diagrams')
    .select('id, title, diagram_type, updated_at, created_at, preview_svg, folder_id, public_slug, project_id')
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.warn('[projects] getRecentDiagrams error:', error.message)
    return []
  }
  return (data ?? []) as DiagramSummary[]
}

export async function getArtifacts(projectId: string): Promise<Artifact[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('artifacts')
    .select('*')
    .eq('project_id', projectId)
    .order('updated_at', { ascending: false })
  if (error) {
    console.warn('[projects] getArtifacts error:', error.message)
    return []
  }
  return (data ?? []) as Artifact[]
}

/** RLS filters artifacts to the current authenticated user automatically. */
export async function getRecentArtifacts(limit = 5): Promise<Artifact[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('artifacts')
    .select('*, projects(name, color)')
    .order('updated_at', { ascending: false })
    .limit(limit)
  if (error) {
    console.warn('[projects] getRecentArtifacts error:', error.message)
    return []
  }
  return (data ?? []) as Artifact[]
}

export async function createProject(name: string, color = '#6366F1'): Promise<Project | null> {
  const supabase = createClient()
  // user_id is required (NOT NULL) and must match auth.uid() for RLS
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    console.warn('[projects] createProject: not authenticated')
    return null
  }
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: user.id, name, color, is_default: false })
    .select()
    .single()
  if (error) {
    console.warn('[projects] createProject error:', error.message)
    return null
  }
  return data as Project
}

export async function renameProject(id: string, name: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('projects')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

export async function updateProjectColor(id: string, color: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('projects')
    .update({ color, updated_at: new Date().toISOString() })
    .eq('id', id)
  return !error
}

export async function deleteProject(id: string): Promise<boolean> {
  const supabase = createClient()
  // Unlink diagrams from the project before deleting
  await supabase.from('diagrams').update({ project_id: null }).eq('project_id', id)
  const { error } = await supabase.from('projects').delete().eq('id', id)
  return !error
}

export async function moveDiagramToProject(diagramId: string, projectId: string | null): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('diagrams')
    .update({ project_id: projectId })
    .eq('id', diagramId)
  return !error
}

export async function moveArtifactToProject(artifactId: string, projectId: string | null): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('artifacts')
    .update({ project_id: projectId, updated_at: new Date().toISOString() })
    .eq('id', artifactId)
  return !error
}

export async function renameDiagram(id: string, title: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('diagrams')
    .update({ title: title.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.warn('[projects] renameDiagram error:', error.message)
  return !error
}

export async function renameArtifact(id: string, title: string): Promise<boolean> {
  const supabase = createClient()
  const { error } = await supabase
    .from('artifacts')
    .update({ title: title.trim(), updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) console.warn('[projects] renameArtifact error:', error.message)
  return !error
}

/** Returns relative time string like "2m ago", "3h ago", "Yesterday" */
export function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
