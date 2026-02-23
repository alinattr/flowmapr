'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { LayoutGrid, Plus, ArrowUpRight, FileText } from 'lucide-react'

interface DiagramSummary {
  id: string
  title: string
  diagram_type: string
  updated_at: string
  created_at: string
}

interface AppSidebarProps {
  plan: string
  diagrams?: DiagramSummary[]
  onNewDiagram?: () => void
}

export function AppSidebar({ plan, diagrams = [], onNewDiagram }: AppSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="flex flex-1 flex-col gap-1 overflow-hidden p-3">
        <div className="flex items-center gap-2 rounded-md bg-[var(--color-accent-subtle)] px-3 py-2 text-sm font-medium text-[var(--color-accent-brand)]">
          <LayoutGrid className="h-4 w-4" strokeWidth={1.5} />
          My diagrams
        </div>

        <Separator className="my-3" />

        <Button
          className="w-full justify-start gap-2"
          size="sm"
          onClick={onNewDiagram}
        >
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          New diagram
        </Button>

        {diagrams.length > 0 && (
          <nav className="mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto">
            {diagrams.map((d) => {
              const isActive = pathname === `/diagram/${d.id}`
              return (
                <Link
                  key={d.id}
                  href={`/diagram/${d.id}`}
                  className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    isActive
                      ? 'bg-[var(--color-accent-subtle)] font-medium text-[var(--color-accent-brand)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)]'
                  }`}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" strokeWidth={1.5} />
                  <span className="truncate">{d.title}</span>
                </Link>
              )
            })}
          </nav>
        )}
      </div>

      {plan === 'free_trial' && (
        <div className="border-t border-[var(--color-border)] p-3">
          <div className="rounded-lg bg-[var(--color-accent-subtle)] p-3">
            <p className="text-xs font-medium text-[var(--color-accent-brand)]">
              Unlock 100 generations/month
            </p>
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Upgrade to Basic — $12/mo
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-7 w-full gap-1 text-xs"
            >
              Upgrade
              <ArrowUpRight className="h-3 w-3" strokeWidth={1.5} />
            </Button>
          </div>
        </div>
      )}
    </aside>
  )
}
