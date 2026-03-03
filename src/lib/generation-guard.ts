/**
 * generation-guard.ts
 *
 * Server-side generation limit enforcement using the `generation_counters`
 * table and the `decrement_generation_counter` Supabase RPC.
 *
 * PREREQUISITE: Apply supabase/migrations/20260303_generation_counters.sql
 * before enabling this guard in production.
 */

import { createAdminClient } from '@/lib/supabase/admin'

export type GuardResult =
  | { allowed: true; remaining: number }
  | { allowed: false; reason: 'limit_exhausted' | 'counter_not_found' | 'db_error' }

/**
 * Atomically checks and decrements the user's generation counter.
 * Uses SECURITY DEFINER RPC so it cannot be spoofed by JWT manipulation.
 */
export async function checkAndDecrementGeneration(
  userId: string
): Promise<GuardResult> {
  try {
    const admin = createAdminClient()

    const { data, error } = await admin.rpc('decrement_generation_counter', {
      p_user_id: userId,
    })

    if (error) {
      // If the table doesn't exist yet (migration not applied), log and allow
      // through so existing quota mechanism stays in control.
      if (
        error.code === '42P01' || // undefined_table
        error.message?.includes('does not exist')
      ) {
        console.warn(
          '[generation-guard] generation_counters table not found — ' +
            'apply supabase/migrations/20260303_generation_counters.sql'
        )
        return { allowed: true, remaining: -1 }
      }
      console.error('[generation-guard] DB error:', error)
      return { allowed: false, reason: 'db_error' }
    }

    const remaining = data as number

    if (remaining === -1) {
      return { allowed: false, reason: 'limit_exhausted' }
    }

    if (remaining === null || remaining === undefined) {
      return { allowed: false, reason: 'counter_not_found' }
    }

    return { allowed: true, remaining }
  } catch (err) {
    console.error('[generation-guard] Unexpected error:', err)
    return { allowed: false, reason: 'db_error' }
  }
}
