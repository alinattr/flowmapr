-- Backfill: assign project_id = user's default project for all diagrams that have project_id = NULL.
-- This fixes diagrams created before project_id was included in the insert.
UPDATE diagrams d
SET project_id = p.id
FROM projects p
WHERE p.user_id = d.user_id
  AND p.is_default = true
  AND d.project_id IS NULL;
