-- ─────────────────────────────────────────────────────────────────────────────
-- RLS policies for all application tables
-- Run AFTER the main schema has been created.
-- All CREATE POLICY statements use IF NOT EXISTS-equivalent pattern via
-- DROP POLICY IF EXISTS so the migration is idempotent.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── DIAGRAMS ─────────────────────────────────────────────────────────────────
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own diagrams only"      ON diagrams;
DROP POLICY IF EXISTS "public read if shared"  ON diagrams;

CREATE POLICY "own diagrams only" ON diagrams
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Allow anyone to read a diagram that has been published as public
CREATE POLICY "public read if shared" ON diagrams
  FOR SELECT
  USING (is_public = true);

-- ── DIAGRAM VERSIONS ─────────────────────────────────────────────────────────
ALTER TABLE diagram_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own versions only" ON diagram_versions;

CREATE POLICY "own versions only" ON diagram_versions
  FOR ALL
  USING (
    diagram_id IN (
      SELECT id FROM diagrams WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    diagram_id IN (
      SELECT id FROM diagrams WHERE user_id = auth.uid()
    )
  );

-- ── SUBSCRIPTIONS ────────────────────────────────────────────────────────────
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own subscription"  ON subscriptions;
DROP POLICY IF EXISTS "deny direct sub write"  ON subscriptions;

CREATE POLICY "read own subscription" ON subscriptions
  FOR SELECT
  USING (user_id = auth.uid());

-- Only service_role (bypasses RLS) may write subscription rows
CREATE POLICY "deny direct sub write" ON subscriptions
  FOR ALL USING (false) WITH CHECK (false);

-- ── FOLDERS ──────────────────────────────────────────────────────────────────
ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own folders only" ON folders;

CREATE POLICY "own folders only" ON folders
  FOR ALL
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
