-- ────────────────────────────────────────────────────────────────────────────
-- Projects refactor — adds projects table and artifacts table
-- Run: supabase db push  (or apply via Supabase dashboard SQL editor)
-- ────────────────────────────────────────────────────────────────────────────

-- ── Projects ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name        TEXT NOT NULL,
  color       TEXT DEFAULT '#6366F1',
  is_default  BOOLEAN DEFAULT FALSE
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own projects only" ON projects;
CREATE POLICY "own projects only" ON projects
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);

-- ── project_id on diagrams ────────────────────────────────────────────────────
ALTER TABLE diagrams ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES projects(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS diagrams_project_id_idx ON diagrams(project_id);

-- ── Artifacts (Code Lens results, Explain Image results, etc.) ────────────────
CREATE TABLE IF NOT EXISTS artifacts (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id   UUID REFERENCES projects(id) ON DELETE SET NULL,
  type         TEXT NOT NULL CHECK (type IN ('diagram', 'code_lens', 'api_lens', 'explain_image')),
  title        TEXT NOT NULL,
  content      JSONB,
  diagram_id   UUID REFERENCES diagrams(id) ON DELETE CASCADE
);

ALTER TABLE artifacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own artifacts only" ON artifacts;
CREATE POLICY "own artifacts only" ON artifacts
  FOR ALL USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS artifacts_user_id_idx    ON artifacts(user_id);
CREATE INDEX IF NOT EXISTS artifacts_project_id_idx ON artifacts(project_id);
CREATE INDEX IF NOT EXISTS artifacts_type_idx        ON artifacts(type);

-- ── Auto-create default project for existing users ───────────────────────────
INSERT INTO projects (user_id, name, is_default, color)
SELECT id, 'My workspace', TRUE, '#6366F1'
FROM auth.users
ON CONFLICT DO NOTHING;

-- ── Move existing diagrams into each user's default project ──────────────────
UPDATE diagrams d
SET project_id = (
  SELECT p.id FROM projects p
  WHERE p.user_id = d.user_id AND p.is_default = TRUE
  LIMIT 1
)
WHERE d.project_id IS NULL;

-- ── Trigger: auto-create default project on new user signup ──────────────────
CREATE OR REPLACE FUNCTION handle_new_user_project()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO projects (user_id, name, is_default, color)
  VALUES (NEW.id, 'My workspace', TRUE, '#6366F1')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_project ON auth.users;
CREATE TRIGGER on_auth_user_created_project
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_project();
