CREATE TABLE IF NOT EXISTS generation_feedback (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  user_id      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  diagram_id   UUID        REFERENCES diagrams(id)   ON DELETE CASCADE,
  diagram_type TEXT,
  rating       TEXT        NOT NULL CHECK (rating IN ('up', 'down')),
  reason       TEXT        CHECK (reason IN (
                 'wrong_structure',
                 'wrong_type',
                 'too_simple',
                 'missing_elements',
                 'other'
               ))
);

ALTER TABLE generation_feedback ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "insert own feedback" ON generation_feedback;
DROP POLICY IF EXISTS "read own feedback"   ON generation_feedback;

CREATE POLICY "insert own feedback" ON generation_feedback
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "read own feedback" ON generation_feedback
  FOR SELECT USING (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS generation_feedback_diagram_type_idx
  ON generation_feedback(diagram_type);

CREATE INDEX IF NOT EXISTS generation_feedback_rating_idx
  ON generation_feedback(rating);
