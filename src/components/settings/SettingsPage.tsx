'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { AppNavbar } from '@/components/shared/AppNavbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Lock,
  Loader2,
  Trash2,
  ArrowUpRight,
} from 'lucide-react'

interface SettingsPageProps {
  email: string
  fullName: string | null
  generationsUsed: number
  monthlyLimit: number
  plan: string
  subscriptionStatus?: string | null
  subscriptionPeriodEnd?: string | null
}

export function SettingsPage({
  email,
  fullName: initialFullName,
  generationsUsed,
  monthlyLimit,
  plan,
  subscriptionStatus = null,
  subscriptionPeriodEnd = null,
}: SettingsPageProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialFullName ?? '')
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [typedDelete, setTypedDelete] = useState('')
  const localSubStatus = subscriptionStatus
  const localSubPeriodEnd = subscriptionPeriodEnd

  const generationsRemaining = monthlyLimit - generationsUsed
  const usagePercent =
    monthlyLimit > 0 ? (generationsUsed / monthlyLimit) * 100 : 0

  const planLabels: Record<string, string> = {
    free: 'Free',
    basic: 'Basic',
    pro: 'Pro',
  }
  const isPaidPlan = plan === 'basic' || plan === 'pro'
  const isCanceledPaid = isPaidPlan && localSubStatus === 'canceled'
  const isActivePaidSubscription = isPaidPlan && localSubStatus !== 'canceled'
  const canDeleteAccount = !isActivePaidSubscription
  const formattedPeriodEnd = localSubPeriodEnd
    ? new Date(localSubPeriodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  async function handleSaveProfile() {
    setSaving(true)
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (error) {
      toast.error('Failed to update profile')
    } else {
      toast.success('Profile updated')
    }

    setSaving(false)
  }

  async function handleDeleteAccount() {
    if (!canDeleteAccount) {
      toast.error('Cancel your subscription before deleting your account.')
      return
    }
    if (typedDelete !== 'DELETE') return
    setDeleting(true)

    const res = await fetch('/api/account/delete', { method: 'POST' })

    if (res.ok) {
      const supabase = createClient()
      await supabase.auth.signOut()
      router.push('/')
    } else {
      const payload = await res.json().catch(() => ({}))
      toast.error((payload.error as string) ?? 'Failed to delete account')
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  async function handleCheckout(targetPlan: 'basic' | 'pro') {
    setCheckoutLoading(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        toast.error('Please sign in again.')
        return
      }

      const res = await fetch('/api/subscriptions/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: targetPlan, userId: user.id }),
      })

      const payload = await res.json().catch(() => ({}))
      if (!res.ok || !payload.checkoutUrl) {
        toast.error((payload.error as string) ?? 'Could not open checkout. Please try again.')
        return
      }

      window.location.href = payload.checkoutUrl as string
    } finally {
      setCheckoutLoading(false)
    }
  }

  return (
    <div className="flex h-screen flex-col bg-[var(--color-bg)]">
      <AppNavbar
        email={email}
        fullName={fullName || null}
        generationsRemaining={generationsRemaining}
      />
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-2xl px-6 py-8">
          <h1 className="text-[30px] font-semibold text-[var(--color-text-primary)]">
            Settings
          </h1>

          {/* Section 1: Profile */}
          <section className="mt-8">
            <h2 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
              Profile
            </h2>
            <div className="mt-4 space-y-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="space-y-2">
                <Label htmlFor="full-name">Full name</Label>
                <Input
                  id="full-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <div className="flex h-9 items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 text-sm text-[var(--color-text-secondary)]">
                  <Lock className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {email}
                </div>
              </div>
              <div className="flex justify-end">
                <Button onClick={handleSaveProfile} disabled={saving} size="sm">
                  {saving && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save
                </Button>
              </div>
            </div>
          </section>

          <Separator className="my-8" />

          {/* Section 2: Subscription & Billing */}
          <section>
            <h2 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
              Subscription & Billing
            </h2>
            <div className="mt-4 space-y-6 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Current plan{isPaidPlan && localSubStatus === 'canceled' && formattedPeriodEnd
                      ? `: ${planLabels[plan]} (cancels ${formattedPeriodEnd})`
                      : ''}
                  </p>
                  <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
                    {plan === 'free'
                      ? `Includes ${monthlyLimit} generations per month`
                      : `Resets monthly on your billing date`}
                  </p>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-[var(--color-accent-subtle)] text-[var(--color-accent-brand)] hover:bg-[var(--color-accent-subtle)]"
                >
                  {planLabels[plan] ?? plan}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">
                    Generation usage
                  </span>
                  <span className="font-medium text-[var(--color-text-primary)]">
                    {generationsUsed} of {monthlyLimit} used
                  </span>
                </div>
                <Progress value={usagePercent} className="h-2" />
              </div>

              {plan === 'free' && (
                <div className="grid gap-3 md:grid-cols-2">
                  {plan === 'free' && (
                    <div className="relative rounded-lg border border-[var(--color-accent-brand)] bg-[var(--color-accent-subtle)] p-4 shadow-[0_0_24px_rgba(99,102,241,0.12)]">
                      <div
                        style={{
                          position: 'absolute',
                          top: -12,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          padding: '4px 14px',
                          borderRadius: 999,
                          background: 'linear-gradient(135deg, #6366F1, #A78BFA)',
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#FFFFFF',
                          fontFamily: 'Inter, sans-serif',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Most popular
                      </div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                        Basic — $20/mo
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)]">
                        <li>100 generations</li>
                        <li>API Lens</li>
                        <li>Version History</li>
                      </ul>
                      <Button
                        size="sm"
                        className="mt-4 w-full gap-1"
                        onClick={() => handleCheckout('basic')}
                        disabled={checkoutLoading}
                      >
                        Upgrade to Basic
                        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                      </Button>
                    </div>
                  )}

                  <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Pro — $50/mo
                    </p>
                    <ul className="mt-2 space-y-1 text-xs text-[var(--color-text-secondary)]">
                      <li>500 generations</li>
                      <li>API Lens + Code Lens</li>
                      <li>Confluence/Notion export</li>
                    </ul>
                    <Button
                      size="sm"
                      className="mt-4 w-full gap-1"
                      onClick={() => handleCheckout('pro')}
                      disabled={checkoutLoading}
                    >
                      Upgrade to Pro
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.5} />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </section>

          <Separator className="my-8" />

          {/* Section 3: Account */}
          <section className="pb-16">
            <h2 className="text-[20px] font-semibold text-[var(--color-text-primary)]">
              Account
            </h2>
            <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Permanently delete your account, all diagrams, and subscription
                data. This action cannot be undone.
              </p>
              <Dialog
                open={deleteDialogOpen}
                onOpenChange={setDeleteDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canDeleteAccount}
                    title={!canDeleteAccount ? 'Cancel your subscription before deleting your account' : undefined}
                    className="mt-4 gap-2 border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-red-50 hover:text-[var(--color-danger)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" strokeWidth={1.5} />
                    Delete account
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-[480px]">
                  <DialogHeader>
                    <DialogTitle>⚠️ Delete account permanently?</DialogTitle>
                    <DialogDescription>
                      This will delete:
                      <br />• All your diagrams and projects
                      <br />• Your subscription data
                      <br />• Your profile
                      <br /><br />
                      Type DELETE to confirm.
                    </DialogDescription>
                  </DialogHeader>
                  <Input
                    value={typedDelete}
                    onChange={(e) => setTypedDelete(e.target.value)}
                    placeholder="DELETE"
                  />
                  <DialogFooter className="gap-2 sm:gap-0">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setDeleteDialogOpen(false)
                        setTypedDelete('')
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleting || typedDelete !== 'DELETE' || !canDeleteAccount}
                    >
                      {deleting && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Delete my account
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
