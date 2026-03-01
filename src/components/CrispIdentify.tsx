'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function CrispIdentify() {
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      if (typeof window === 'undefined' || !window.$crisp) return
      window.$crisp.push(['set', 'user:email', user.email ?? ''])
      const name = user.user_metadata?.full_name as string | undefined
      if (name) window.$crisp.push(['set', 'user:nickname', name])
    })
  }, [])

  return null
}
