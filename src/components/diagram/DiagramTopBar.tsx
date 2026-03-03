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
  Code,
  History,
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
  userPlan?: string
  onHistoryOpen?: () => void
  onExplainOpen?: () => void
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
  userPlan,
  onHistoryOpen,
  onExplainOpen,
}: DiagramTopBarProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(title)
  const [shareOpen, setShareOpen] = useState(false)
  const [shareTab, setShareTab] = useState<'link' | 'embed'>('link')
  const [isPublic, setIsPublic] = useState(initialIsPublic)
  const [publicSlug, setPublicSlug] = useState(initialSlug)
  const [copied, setCopied] = useState(false)
  const [embedCopied, setEmbedCopied] = useState(false)
  const [sharing, setSharing] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // Export dialog state
  const [exportOpen, setExportOpen] = useState(false)
  const [exportTab, setExportTab] = useState<'download' | 'integrations'>('download')
  // GitHub integration state
  const [ghView, setGhView] = useState<'form' | 'success'>('form')
  const [ghToken, setGhToken] = useState('')
  const [ghRepo, setGhRepo] = useState('')
  const [ghBranch, setGhBranch] = useState('main')
  const [ghPath, setGhPath] = useState('')
  const [ghCommit, setGhCommit] = useState('')
  const [ghPushing, setGhPushing] = useState(false)
  const [ghMarkdown, setGhMarkdown] = useState('')
  const [ghMarkdownCopied, setGhMarkdownCopied] = useState(false)
  // Notion / Confluence instruction state
  const [integrationView, setIntegrationView] = useState<'list' | 'github' | 'notion' | 'confluence'>('list')

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

  async function getPngDataUrl(): Promise<string | null> {
    const target = getExportTarget()
    if (!target) return null
    try {
      return await toPng(target, { backgroundColor: '#ffffff', pixelRatio: 2 })
    } catch {
      return null
    }
  }

  async function handlePushToGitHub() {
    if (!ghToken || !ghRepo || !ghPath) {
      toast.error('Please fill in token, repository, and file path')
      return
    }
    setGhPushing(true)
    try {
      const dataUrl = await getPngDataUrl()
      if (!dataUrl) { toast.error('Nothing to export'); setGhPushing(false); return }

      // dataUrl is "data:image/png;base64,<base64>" — strip the prefix
      const base64 = dataUrl.split(',')[1]

      // Check if file already exists (need SHA for updates)
      let existingSha: string | undefined
      const checkRes = await fetch(
        `https://api.github.com/repos/${ghRepo}/contents/${ghPath}`,
        { headers: { Authorization: `token ${ghToken}`, Accept: 'application/vnd.github+json' } }
      )
      if (checkRes.ok) {
        const existing = await checkRes.json() as { sha?: string }
        existingSha = existing.sha
      }

      const body: Record<string, unknown> = {
        message: ghCommit || `Update ${title} diagram`,
        content: base64,
        branch: ghBranch || 'main',
      }
      if (existingSha) body.sha = existingSha

      const res = await fetch(
        `https://api.github.com/repos/${ghRepo}/contents/${ghPath}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `token ${ghToken}`,
            'Content-Type': 'application/json',
            Accept: 'application/vnd.github+json',
          },
          body: JSON.stringify(body),
        }
      )

      if (!res.ok) {
        const err = await res.json() as { message?: string }
        throw new Error(err.message ?? 'GitHub API error')
      }

      const data = await res.json() as { content?: { download_url?: string } }
      const imageUrl = data.content?.download_url ?? ''
      const safeName = title.replace(/[[\]]/g, '')
      setGhMarkdown(`![${safeName}](${imageUrl})`)
      setGhView('success')
      toast.success('Pushed to GitHub!')
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'GitHub push failed')
    } finally {
      setGhPushing(false)
    }
  }

  function resetExportDialog() {
    setExportTab('download')
    setIntegrationView('list')
    setGhView('form')
    setGhMarkdown('')
    setGhMarkdownCopied(false)
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

          {/* History button — Basic/Pro only */}
          {userPlan === 'basic' || userPlan === 'pro' ? (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={onHistoryOpen}
            >
              <History className="h-3.5 w-3.5" strokeWidth={1.5} />
              History
            </Button>
          ) : (
            <div style={{ position: 'relative' }} className="group">
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 cursor-not-allowed opacity-40"
                disabled
              >
                <History className="h-3.5 w-3.5" strokeWidth={1.5} />
                History
              </Button>
              <div
                className="pointer-events-none absolute bottom-[-34px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md border border-[rgba(255,255,255,0.1)] bg-[#18181B] px-2.5 py-1 text-[11px] text-[#94A3B8] opacity-0 transition-opacity group-hover:opacity-100"
                style={{ zIndex: 60 }}
              >
                Basic plan required
              </div>
            </div>
          )}

          {/* Explain button — available to all plans */}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={onExplainOpen}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="16" x2="12" y2="12"/>
              <line x1="12" y1="8" x2="12.01" y2="8"/>
            </svg>
            Explain
          </Button>

          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => { resetExportDialog(); setExportOpen(true) }}
          >
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Export
          </Button>

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

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-1">
            <button
              onClick={() => setShareTab('link')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                shareTab === 'link'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <LinkIcon className="h-3 w-3" strokeWidth={1.5} />
              Share link
            </button>
            <button
              onClick={() => setShareTab('embed')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                shareTab === 'embed'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Code className="h-3 w-3" strokeWidth={1.5} />
              Embed
            </button>
          </div>

          {shareTab === 'link' && (
            <>
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
            </>
          )}

          {shareTab === 'embed' && (
            <>
              {userPlan !== 'pro' ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '24px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(99,102,241,0.1)',
                      border: '1px solid rgba(99,102,241,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Code className="h-5 w-5" style={{ color: '#6366F1' }} strokeWidth={1.5} />
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Share &amp; embed is available on the <strong style={{ color: 'var(--color-text-primary)' }}>Pro plan</strong>
                  </p>
                  <a
                    href="/#pricing"
                    onClick={() => setShareOpen(false)}
                    style={{
                      padding: '8px 20px',
                      background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                      color: 'white',
                      borderRadius: 8,
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: 600,
                      boxShadow: '0 0 20px rgba(99,102,241,0.3)',
                    }}
                  >
                    Upgrade to Pro
                  </a>
                </div>
              ) : !isPublic ? (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                    Enable public sharing first to generate an embed code.
                  </p>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={async () => {
                      await handleToggleShare()
                      setShareTab('embed')
                    }}
                    disabled={sharing}
                    className="gap-1.5"
                  >
                    <LinkIcon className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Enable public sharing
                  </Button>
                </div>
              ) : (
                <>
                  <div>
                    <p className="mb-2 text-xs text-[var(--color-text-secondary)]">
                      Copy and paste this code into your website or docs:
                    </p>
                    <div
                      style={{
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                        padding: '10px 12px',
                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                        fontSize: 11,
                        color: '#94A3B8',
                        whiteSpace: 'pre',
                        overflow: 'auto',
                        lineHeight: 1.6,
                      }}
                    >{`<iframe\n  src="${typeof window !== 'undefined' ? window.location.origin : 'https://app.flowmapr.com'}/embed/${diagramId}"\n  width="800"\n  height="600"\n  frameborder="0"\n  allowfullscreen>\n</iframe>`}</div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={() => {
                        const embedCode = `<iframe\n  src="${window.location.origin}/embed/${diagramId}"\n  width="800"\n  height="600"\n  frameborder="0"\n  allowfullscreen>\n</iframe>`
                        navigator.clipboard.writeText(embedCode)
                        setEmbedCopied(true)
                        setTimeout(() => setEmbedCopied(false), 2000)
                      }}
                    >
                      {embedCopied ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={1.5} />
                      ) : (
                        <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />
                      )}
                      {embedCopied ? 'Copied!' : 'Copy embed code'}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Export Dialog ─────────────────────────────────────── */}
      <Dialog open={exportOpen} onOpenChange={open => { setExportOpen(open); if (!open) resetExportDialog() }}>
        <DialogContent className="max-w-[480px]">
          <DialogHeader>
            <DialogTitle>Export diagram</DialogTitle>
          </DialogHeader>

          {/* Tabs */}
          <div className="flex gap-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-1">
            <button
              onClick={() => setExportTab('download')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                exportTab === 'download'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Download className="h-3 w-3" strokeWidth={1.5} />
              Download
            </button>
            <button
              onClick={() => setExportTab('integrations')}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                exportTab === 'integrations'
                  ? 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-sm'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
              }`}
            >
              <Code2 className="h-3 w-3" strokeWidth={1.5} />
              Export to…
            </button>
          </div>

          {/* Download tab */}
          {exportTab === 'download' && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => { handleExportPng(); setExportOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileImage style={{ width: 16, height: 16, color: '#818CF8' }} strokeWidth={1.5} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>Export as PNG</div>
                  <div style={{ fontSize: 11, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>High-resolution image, 2× pixel ratio</div>
                </div>
              </button>

              <button
                onClick={() => { handleExportPdf(); setExportOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 14px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <FileText style={{ width: 16, height: 16, color: '#F87171' }} strokeWidth={1.5} />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>Export as PDF</div>
                  <div style={{ fontSize: 11, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>Print-ready PDF document</div>
                </div>
              </button>
            </div>
          )}

          {/* Export to... tab */}
          {exportTab === 'integrations' && (
            <>
              {userPlan !== 'pro' ? (
                /* Upgrade gate */
                <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>⬡</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>
                    Pro feature
                  </div>
                  <div style={{ fontSize: 12, color: '#71717A', fontFamily: 'Inter, sans-serif', marginBottom: 16, lineHeight: 1.6 }}>
                    Export directly to GitHub, Notion, and Confluence
                  </div>
                  <a
                    href="/#pricing"
                    onClick={() => setExportOpen(false)}
                    style={{ padding: '7px 16px', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: 'white', borderRadius: 8, textDecoration: 'none', fontSize: 12, fontWeight: 600 }}
                  >
                    Upgrade to Pro
                  </a>
                </div>
              ) : integrationView === 'list' ? (
                /* Integration list */
                <div className="flex flex-col gap-2">
                  {[
                    { id: 'github', label: 'GitHub README', icon: '⬡', desc: 'Push diagram PNG to any repository', accent: 'rgba(241,245,249,0.08)', iconColor: '#E2E8F0' },
                    { id: 'notion', label: 'Notion', icon: 'N', desc: 'Insert diagram image into a Notion page', accent: 'rgba(255,255,255,0.06)', iconColor: '#F8FAFC' },
                    { id: 'confluence', label: 'Confluence', icon: '◈', desc: 'Attach diagram to a Confluence page', accent: 'rgba(38,132,255,0.12)', iconColor: '#2684FF' },
                  ].map(item => (
                    <button
                      key={item.id}
                      onClick={() => setIntegrationView(item.id as 'github' | 'notion' | 'confluence')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        cursor: 'pointer', textAlign: 'left', width: '100%',
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: item.accent, border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: item.iconColor, fontWeight: 700, flexShrink: 0 }}>
                        {item.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: '#52525B', fontFamily: 'Inter, sans-serif' }}>{item.desc}</div>
                      </div>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#52525B" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
                    </button>
                  ))}
                </div>
              ) : integrationView === 'github' ? (
                /* GitHub form / success */
                <>
                  <button
                    onClick={() => { setGhView('form'); setIntegrationView('list') }}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#52525B', cursor: 'pointer', fontSize: 12, marginBottom: 4, padding: 0, fontFamily: 'Inter, sans-serif' }}
                  >
                    ← Back
                  </button>

                  {ghView === 'success' ? (
                    <div style={{ textAlign: 'center', padding: '8px 0' }}>
                      <div style={{ fontSize: 24, marginBottom: 10 }}>✓</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', marginBottom: 6, fontFamily: 'Inter, sans-serif' }}>Pushed to GitHub!</div>
                      <div style={{ fontSize: 12, color: '#71717A', marginBottom: 16, fontFamily: 'Inter, sans-serif' }}>Copy this Markdown snippet into your README:</div>
                      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '10px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#94A3B8', wordBreak: 'break-all', textAlign: 'left', marginBottom: 12 }}>
                        {ghMarkdown}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1.5"
                        onClick={() => { navigator.clipboard.writeText(ghMarkdown); setGhMarkdownCopied(true); setTimeout(() => setGhMarkdownCopied(false), 2000) }}
                      >
                        {ghMarkdownCopied ? <Check className="h-3.5 w-3.5" strokeWidth={1.5} /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.5} />}
                        {ghMarkdownCopied ? 'Copied!' : 'Copy Markdown'}
                      </Button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: 'Personal Access Token', value: ghToken, setter: setGhToken, placeholder: 'ghp_xxxxxxxxxxxx', type: 'password' },
                        { label: 'Repository (owner/repo)', value: ghRepo, setter: setGhRepo, placeholder: 'acme/my-docs', type: 'text' },
                        { label: 'Branch', value: ghBranch, setter: setGhBranch, placeholder: 'main', type: 'text' },
                        { label: 'File path (e.g. docs/diagram.png)', value: ghPath, setter: setGhPath, placeholder: 'docs/architecture.png', type: 'text' },
                        { label: 'Commit message (optional)', value: ghCommit, setter: setGhCommit, placeholder: `Update ${title} diagram`, type: 'text' },
                      ].map(f => (
                        <div key={f.label}>
                          <label style={{ fontSize: 11, color: '#71717A', display: 'block', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>{f.label}</label>
                          <input
                            type={f.type}
                            value={f.value}
                            onChange={e => f.setter(e.target.value)}
                            placeholder={f.placeholder}
                            style={{ width: '100%', padding: '8px 12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, color: '#F1F5F9', fontSize: 12, fontFamily: 'Inter, sans-serif', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                      <div style={{ padding: '8px 10px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 7, fontSize: 11, color: '#71717A', fontFamily: 'Inter, sans-serif', lineHeight: 1.5 }}>
                        💡 Token needs <strong style={{ color: '#94A3B8' }}>repo</strong> scope. It is never stored on our servers.
                      </div>
                      <Button
                        onClick={handlePushToGitHub}
                        disabled={ghPushing || !ghToken || !ghRepo || !ghPath}
                        className="gap-1.5 mt-1"
                      >
                        {ghPushing ? 'Pushing…' : '⬡ Push to GitHub'}
                      </Button>
                    </div>
                  )}
                </>
              ) : integrationView === 'notion' ? (
                /* Notion instructions */
                <>
                  <button
                    onClick={() => setIntegrationView('list')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#52525B', cursor: 'pointer', fontSize: 12, marginBottom: 4, padding: 0, fontFamily: 'Inter, sans-serif' }}
                  >
                    ← Back
                  </button>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', marginBottom: 14 }}>Add to Notion</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                    {[
                      'Download the PNG (tap the button below)',
                      'Open your Notion page',
                      'Type /image and press Enter',
                      'Upload the downloaded PNG file',
                    ].map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#818CF8', flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ padding: '10px 12px', background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 8, fontSize: 11, color: '#71717A', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, marginBottom: 14 }}>
                    💡 Full Notion OAuth integration coming soon — you&apos;ll be able to insert directly into any page.
                  </div>
                  <Button onClick={() => { handleExportPng() }} className="gap-1.5 w-full">
                    <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Download PNG
                  </Button>
                </>
              ) : (
                /* Confluence instructions */
                <>
                  <button
                    onClick={() => setIntegrationView('list')}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#52525B', cursor: 'pointer', fontSize: 12, marginBottom: 4, padding: 0, fontFamily: 'Inter, sans-serif' }}
                  >
                    ← Back
                  </button>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#F1F5F9', fontFamily: 'Inter, sans-serif', marginBottom: 14 }}>Add to Confluence</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
                    {[
                      'Download the PNG (tap the button below)',
                      'Open your Confluence page in edit mode',
                      'Click "+" → Insert → Files & Images',
                      'Upload the downloaded PNG',
                      'Optionally use wiki markup to set width',
                    ].map((step, i) => (
                      <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 20, height: 20, borderRadius: 6, background: 'rgba(38,132,255,0.12)', border: '1px solid rgba(38,132,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#2684FF', flexShrink: 0 }}>
                          {i + 1}
                        </div>
                        <span style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, fontFamily: 'Inter, sans-serif' }}>{step}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: '#71717A', fontFamily: 'Inter, sans-serif', marginBottom: 6 }}>Wiki markup snippet:</div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 7, padding: '8px 12px', fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#94A3B8', marginBottom: 14 }}>
                    !{title.replace(/\s+/g, '-')}.png|width=800!
                  </div>
                  <Button onClick={() => { handleExportPng() }} className="gap-1.5 w-full">
                    <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
                    Download PNG
                  </Button>
                </>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
