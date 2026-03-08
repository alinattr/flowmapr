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
      // Graceful passthrough when the counter infrastructure isn't deployed:
      // - 42P01: generation_counters table doesn't exist
      // - PGRST202: PostgREST can't find the function in its schema cache
      //   (happens when generation_counters table / decrement fn are absent)
      // In both cases fall back to the subscriptions-table quota check.
      if (
        error.code === '42P01' ||    // undefined_table
        error.code === 'PGRST202' || // function not found in schema cache
        error.message?.includes('does not exist') ||
        error.message?.includes('Could not find the function')
      ) {
        console.warn(
          '[generation-guard] decrement_generation_counter not available — ' +
            'falling back to subscriptions quota check'
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
