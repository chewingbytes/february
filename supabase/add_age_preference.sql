-- ═══════════════════════════════════════════════════════════════════════
-- Website quiz — age-gap preference columns (run ONCE in the Supabase SQL
-- editor). Adds "would you date someone younger / older, and how many years"
-- to the public `questionnaire` table the application quiz writes to.
--
-- Semantics written by components/QuestionnaireForm.tsx:
--   accepts_younger / accepts_older  → the direction toggles (both may be
--                                      false = "same age only")
--   max_years_younger / max_years_older → the stretch for each direction they
--                                      accept; NULL when that toggle is off.
--
-- Idempotent — safe to re-run.
-- ═══════════════════════════════════════════════════════════════════════
alter table public.questionnaire
  add column if not exists accepts_younger   boolean,
  add column if not exists accepts_older     boolean,
  add column if not exists max_years_younger int,
  add column if not exists max_years_older   int;
