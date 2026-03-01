'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import {
  Download,
  Share2,
  Sparkles,
  Settings,
  LogOut,
  CreditCard,
  ChevronLeft,
  FileImage,
  FileText,
  Copy,
  Check,
  Link as LinkIcon,
  Code2,
} from 'lucide-react'
import type { Node, Edge } from '@xyflow/react'
import { generatePlantUML } from '@/lib/uml/plantuml'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface DiagramTopBarProps {
  diagramId: string
  title: string
  onTitleChange: (title: string) => void
  saveStatus: 'saved' | 'saving' | null
  generationsRemaining: number
  email: string
  fullName: string | null
  isPublic: boolean
  publicSlug: string | null
  diagramType?: string
  nodes?: Node[]
  edges?: Edge[]
}

export function DiagramTopBar({
  diagramId,
  title,
  onTitleChange,
  saveStatus,
  generationsRemaining,
  email,
  fullName,
  isPublic: initialIsPublic,
  publicSlug: initialSlug,
  diagramType,
  nodes: currentNodes,
  edges: currentEdges,
}: DiagramTopBarProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)
  const [shareOpen, setShareOpen] = useState(false)
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [publicSlug, setPublicSlug] = useState(initialSlug)
  const [copied, setCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : email[0].toUpperCase()

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editing])

  function commitTitle() {
    setEditing(false)
    const trimmed = editValue.trim() || 'Untitled diagram'
    setEditValue(trimmed)
    if (trimmed !== title) {
      onTitleChange(trimmed)
    }
  }

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  function getExportTarget(): HTMLElement | null {
    const rfViewport = document.querySelector('.react-flow__viewport')
    if (rfViewport) return rfViewport as HTMLElement
    const diagramSvg = document.querySelector('svg[data-diagram]')
    if (diagramSvg) return diagramSvg as unknown as HTMLElement
    return null
  }

  async function handleExportPng() {
    const target = getExportTarget()
    if (!target) { toast.error('Nothing to export'); return }
    try {
      const dataUrl = await toPng(target, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      })
      const link = document.createElement('a')
      link.download = `${title}.png`
      link.href = dataUrl
      link.click()
      toast.success('PNG exported')
    } catch {
      toast.error('Failed to export PNG')
    }
  }

  async function handleExportPdf() {
    const target = getExportTarget()
    if (!target) { toast.error('Nothing to export'); return }
    try {
      const dataUrl = await toPng(target, {
        backgroundColor: '#ffffff',
        pixelRatio: 2,
      })
      const img = new Image()
      img.src = dataUrl
      await new Promise((res) => (img.onload = res))
      const pdf = new jsPDF({
        orientation: img.width > img.height ? 'landscape' : 'portrait',
        unit: 'px',
        format: [img.width / 2, img.height / 2],
      })
      pdf.addImage(dataUrl, 'PNG', 0, 0, img.width / 2, img.height / 2)
      pdf.save(`${title}.pdf`)
      toast.success('PDF exported')
    } catch {
      toast.error('Failed to export PDF')
    }
  }

  async function handleToggleShare() {
    setSharing(true)
    const supabase = createClient()

    if (isPublic) {
      await supabase
        .from('diagrams')
        .update({ is_public: false, public_slug: null })
        .eq('id', diagramId)
      setIsPublic(false)
      setPublicSlug(null)
      toast.success('Link disabled')
    } else {
      const slug = diagramId.slice(0, 8)
      await supabase
        .from('diagrams')
        .update({ is_public: true, public_slug: slug })
        .eq('id', diagramId)
      setIsPublic(true)
      setPublicSlug(slug)
      toast.success('Share link created')
    }
    setSharing(false)
  }

  function copyShareLink() {
    if (!publicSlug) return
    const url = `${window.location.origin}/share/${publicSlug}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareUrl = publicSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/share/${publicSlug}`
    : ''

  return (
    <>
      <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2" asChild>
            <Link href="/workspace">
              <ChevronLeft className="h-4 w-4" strokeWidth={1.5} />
              <span className="text-xs">Diagrams</span>
            </Link>
          </Button>
          <div className="h-4 w-px bg-[var(--color-border)]" />
          {editing ? (
            <input
              ref={inputRef}
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitTitle()
                if (e.key === 'Escape') {
                  setEditValue(title)
                  setEditing(false)
                }
              }}
              className="h-7 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm font-medium text-[var(--color-text-primary)] outline-none focus:border-[var(--color-accent-brand)]"
            />
          ) : (
            <button
              onClick={() => {
                setEditValue(title)
                setEditing(true)
              }}
              className="rounded-md px-2 py-1 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
            >
              {title}
            </button>
          )}
          {saveStatus && (
            <span className="text-xs text-[var(--color-text-secondary)]">
              {saveStatus === 'saving' ? 'Saving…' : 'Saved'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="gap-1.5 bg-[var(--color-accent-subtle)] text-[var(--color-accent-brand)] hover:bg-[var(--color-accent-subtle)]"
          >
            <Sparkles className="h-3 w-3" strokeWidth={1.5} />
            {generationsRemaining}
          </Badge>

          <ThemeToggle />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPng}>
                <FileImage className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Export as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportPdf}>
                <FileText className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Export as PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {diagramType === 'uml_class' && currentNodes && currentEdges && (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                const code = generatePlantUML(currentNodes, currentEdges)
                navigator.clipboard.writeText(code)
                toast.success('PlantUML code copied to clipboard')
              }}
            >
              <Code2 className="h-3.5 w-3.5" strokeWidth={1.5} />
              Copy PlantUML
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setShareOpen(true)}
          >
            <Share2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            Share
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full p-0">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[var(--color-surface-raised)] text-xs text-[var(--color-text-secondary)]">
                    {initials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {fullName || 'User'}
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  {email}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <CreditCard className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Billing
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Share diagram</DialogTitle>
            <DialogDescription>
              {isPublic
                ? 'Anyone with the link can view this diagram (read-only).'
                : 'Create a public read-only link to share this diagram.'}
            </DialogDescription>
          </DialogHeader>

          {isPublic && publicSlug && (
            <div className="flex items-center gap-2">
              <Input value={shareUrl} readOnly className="text-sm" />
              <Button
                variant="outline"
                size="sm"
                className="shrink-0 gap-1.5"
                onClick={copyShareLink}
              >
                {copied ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                ) : (
                  <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                )}
                {copied ? 'Copied' : 'Copy'}
              </Button>
            </div>
          )}

          <DialogFooter>
            <Button
              variant={isPublic ? 'outline' : 'default'}
              onClick={handleToggleShare}
              disabled={sharing}
              className="gap-1.5"
            >
              <LinkIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
              {isPublic ? 'Disable link' : 'Create share link'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
