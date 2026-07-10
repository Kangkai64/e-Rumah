-- Migration 020: Fix two misleading admin dashboard stat cards.
--
-- 1. "Reports Generated - This month" counted rows in public.reports whose
--    generated_at fell in the current month. But generated_at is bumped by
--    Admin.viewMonthlyReport() every time an admin merely VIEWS an existing
--    report (it upserts the same period's row), not just when a report is
--    newly created. So opening an old report inflates "this month"'s count.
--    Fix: add created_at, set once on insert and never touched by updates,
--    and have the dashboard stat count on created_at instead.
--
-- 2. "Rejected - Last 30 days" counted ALL rejected applications ever, with
--    no date filter at all. Fix: add applications.rejected_at (mirroring the
--    existing reviewed_at/approved_at columns), set it wherever an
--    application's status is set to 'rejected', and filter the dashboard
--    stat on it.

ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS created_at timestamp with time zone NOT NULL DEFAULT now();

-- Backfill: best available proxy for existing rows is their current
-- generated_at (we have no earlier record of when they were first created).
UPDATE public.reports
SET created_at = generated_at
WHERE created_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports USING btree (created_at);

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS rejected_at timestamp with time zone NULL;

-- Backfill: best available proxy for existing rejected applications is
-- updated_at (we have no earlier record of when they were rejected).
UPDATE public.applications
SET rejected_at = updated_at
WHERE status = 'rejected'
  AND rejected_at IS NULL;
