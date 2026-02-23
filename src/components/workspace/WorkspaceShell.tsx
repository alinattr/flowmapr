'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AppNavbar } from '@/components/shared/AppNavbar'
import { AppSidebar } from '@/components/shared/AppSidebar'
import { GenerateDialog } from '@/components/workspace/GenerateDialog'
import { Button } from '@/components/ui/button'
import { GitBranch, Sparkles, FileText, MoreHorizontal, Trash2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface DiagramSummary {
  id: string
  title: string
  diagram_type: string
  updated_at: string
  created_at: string
}

interface WorkspaceShellProps {
  email: string
  fullName: string | null
  generationsRemaining: number
  plan: string
  diagrams: DiagramSummary[]
}

export function WorkspaceShell({
  email,
  fullName,
  generationsRemaining,
  plan,
  diagrams: initialDiagrams,
}: WorkspaceShellProps) {
  const [generateOpen, setGenerateOpen] = useState(false)
  const [diagrams, setDiagrams] = useState(initialDiagrams)
  const router = useRouter()

  async function handleDelete(id: string) {
    const supabase = createClient()
    const { error } = await supabase.from('diagrams').delete().eq('id', id)
    if (error) {
      toast.error('Failed to delete diagram')
      return
    }
    setDiagrams((prev) => prev.filter((d) => d.id !== id))
    toast.success('Diagram deleted')
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours}h ago`
    const diffDays = Math.floor(diffHours / 24)
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const hasDiagrams = diagrams.length > 0

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      <AppNavbar
        email={email}
        fullName={fullName}
        generationsRemaining={generationsRemaining}
      />
      <div className="flex flex-1 overflow-hidden">
        <AppSidebar
          plan={plan}
          diagrams={diagrams}
          onNewDiagram={() => setGenerateOpen(true)}
        />
        <main className="flex flex-1 flex-col overflow-auto">
          {hasDiagrams ? (
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  My diagrams
                </h1>
                <Button
                  size="sm"
                  className="gap-2"
                  onClick={() => setGenerateOpen(true)}
                >
                  <Sparkles className="h-3.5 w-3.5" strokeWidth={1.5} />
                  New diagram
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {diagrams.map((d) => (
                  <div
                    key={d.id}
                    className="group relative rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] transition-shadow hover:shadow-md"
                  >
                    <Link
                      href={`/diagram/${d.id}`}
                      className="block p-4"
                    >
                      <div className="mb-3 flex h-28 items-center justify-center rounded-lg bg-[var(--color-surface-raised)]">
                        <FileText
                          className="h-10 w-10 text-[var(--color-text-tertiary)]"
                          strokeWidth={1}
                        />
                      </div>
                      <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                        {d.title}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded bg-[var(--color-accent-subtle)] px-1.5 py-0.5 text-[10px] font-medium uppercase text-[var(--color-accent-brand)]">
                          {d.diagram_type === 'bpmn' ? 'BPMN' : 'User Flow'}
                        </span>
                        <span className="text-xs text-[var(--color-text-tertiary)]">
                          {formatDate(d.updated_at)}
                        </span>
                      </div>
                    </Link>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="absolute right-2 top-2 rounded-md p-1 opacity-0 transition-opacity hover:bg-[var(--color-surface-raised)] group-hover:opacity-100">
                          <MoreHorizontal
                            className="h-4 w-4 text-[var(--color-text-secondary)]"
                            strokeWidth={1.5}
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          className="text-[var(--color-danger)]"
                          onClick={() => handleDelete(d.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" strokeWidth={1.5} />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex max-w-sm flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-accent-subtle)]">
                  <GitBranch
                    className="h-8 w-8 text-[var(--color-accent-brand)]"
                    strokeWidth={1.5}
                  />
                </div>
                <h1 className="mt-6 text-xl font-semibold text-[var(--color-text-primary)]">
                  Create your first diagram
                </h1>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  You have {generationsRemaining} free generations to try
                  Flowmapr. Describe any process and get a clean BPMN or User
                  Flow diagram in seconds.
                </p>
                <Button
                  className="mt-6 gap-2"
                  size="default"
                  onClick={() => setGenerateOpen(true)}
                >
                  <Sparkles className="h-4 w-4" strokeWidth={1.5} />
                  Generate a diagram
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>

      <GenerateDialog open={generateOpen} onOpenChange={setGenerateOpen} />
    </div>
  )
}
