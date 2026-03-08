-- Re-assert RLS policy for diagram_versions so that inserts from client-side
-- code work correctly for ALL diagrams (including those created by Code Lens).
-- This is idempotent — safe to run multiple times.

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
