-- Generation counters table (separate from subscriptions — atomic, tamper-proof)
CREATE TABLE IF NOT EXISTS generation_counters (
  id         UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id    UUID         REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  plan       TEXT         NOT NULL DEFAULT 'free',
  remaining  INTEGER      NOT NULL DEFAULT 5,
  total_used INTEGER      NOT NULL DEFAULT 0,
  resets_at  TIMESTAMPTZ,
  updated_at TIMESTAMPTZ  DEFAULT NOW()
);

ALTER TABLE generation_counters ENABLE ROW LEVEL SECURITY;

-- Users can read their own counter, never write directly
CREATE POLICY "read own counter" ON generation_counters
  FOR SELECT USING (user_id = auth.uid());

-- Block direct writes from all roles except service_role (which bypasses RLS)
CREATE POLICY "deny direct write" ON generation_counters
  FOR ALL USING (false) WITH CHECK (false);

-- ─────────────────────────────────────────────────────────────────────────────
-- Atomic decrement — checks AND decrements in one serialisable transaction.
-- Returns new remaining value, or -1 if the limit was already exhausted.
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION decrement_generation_counter(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_remaining INTEGER;
BEGIN
  UPDATE generation_counters
  SET
    remaining  = remaining  - 1,
    total_used = total_used + 1,
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND remaining > 0
  RETURNING remaining INTO v_remaining;

  IF NOT FOUND THEN
    RETURN -1;  -- limit exhausted
  END IF;

  RETURN v_remaining;
END;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-create a counter row for every new user (trigger on auth.users)
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user_counter()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO generation_counters (user_id, plan, remaining, total_used)
  VALUES (NEW.id, 'free', 5, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Drop before recreating so the migration is idempotent
DROP TRIGGER IF EXISTS on_auth_user_created_counter ON auth.users;

CREATE TRIGGER on_auth_user_created_counter
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_counter();

-- Backfill existing users who have no counter row yet
INSERT INTO generation_counters (user_id, plan, remaining, total_used)
SELECT id, 'free', 5, 0
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM generation_counters)
ON CONFLICT (user_id) DO NOTHING;
