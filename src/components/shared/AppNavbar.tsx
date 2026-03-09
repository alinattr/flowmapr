'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Settings, LogOut, CreditCard, Sparkles } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { LogoMark } from '@/components/shared/LogoIcon'
import { useTheme } from '@/lib/theme/ThemeProvider'

interface AppNavbarProps {
  email: string
  fullName: string | null
  generationsRemaining: number
}

export function AppNavbar({
  email,
  fullName,
  generationsRemaining,
}: AppNavbarProps) {
  const router = useRouter()
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [plan, setPlan] = useState<string | null>(null)

  const initials = fullName
    ? fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : email[0].toUpperCase()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  useEffect(() => {
    let active = true
    const supabase = createClient()

    const loadPlan = async () => {
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user || !active) return
      const { data } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', user.id)
        .maybeSingle()
      if (active) setPlan(data?.plan ?? 'free')
    }

    loadPlan()
    return () => { active = false }
  }, [])

  const isPaidPlan = plan === 'basic' || plan === 'pro'

  return (
    <header className="flex h-12 shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4">
      <Link
        href="/"
        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        <LogoMark size={26} />
        <span style={{
          fontSize: 15,
          fontWeight: 700,
          color: isDark ? '#F8FAFC' : '#111827',
          fontFamily: 'Inter, sans-serif',
          letterSpacing: '-0.02em',
        }}>
          flowmapr
        </span>
      </Link>

      <div className="flex items-center gap-3">
        <ThemeToggle />
        <Badge
          variant="secondary"
          className="gap-1.5 bg-[var(--color-accent-subtle)] text-[var(--color-accent-brand)] hover:bg-[var(--color-accent-subtle)]"
        >
          <Sparkles className="h-3 w-3" strokeWidth={1.5} />
          {generationsRemaining} generations remaining
        </Badge>

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
            {isPaidPlan && (
              <DropdownMenuItem asChild>
                <Link href="/settings#billing">
                  <CreditCard className="mr-2 h-4 w-4" strokeWidth={1.5} />
                  Subscription
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" strokeWidth={1.5} />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
