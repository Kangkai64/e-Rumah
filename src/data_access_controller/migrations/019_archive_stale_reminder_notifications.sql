-- Migration 019: One-time cleanup of the reminder_notifications backlog that
-- built up while generate_reminder_notifications()/the processor were broken
-- (see migrations/018_reminder_and_health_report_automation.sql).
--
-- Without this, the newly-fixed invoke-reminder-processor-every-minute cron
-- job would immediately try to email users about every notification that was
-- ever scheduled and never sent - including ones many weeks/months overdue,
-- which is no longer useful or wanted.
--
-- Approach: mark stale unsent notifications as sent WITHOUT emailing anyone,
-- so they're excluded from future processor runs but remain in the table for
-- audit purposes. A new skipped_reason column distinguishes "we deliberately
-- skipped this because it was stale" from "this was actually emailed" - do
-- not rely on sent_at alone to tell the two apart.
--
-- "Stale" = scheduled_time more than 1 day in the past, regardless of whether
-- the underlying reminder's reminder_date itself has passed yet.
--
-- Safe to re-run: the WHERE clause only ever touches rows that are still
-- is_sent = false, so already-archived/already-sent rows are untouched.

ALTER TABLE public.reminder_notifications
  ADD COLUMN IF NOT EXISTS skipped_reason text NULL;

UPDATE public.reminder_notifications
SET
  is_sent = true,
  sent_at = now(),
  skipped_reason = 'stale_backlog_archived_2026-07-08'
WHERE
  is_sent = false
  AND scheduled_time < now() - interval '1 day';

-- Sanity check after running - review what got archived:
-- select rn.id, rn.reminder_id, rn.scheduled_time, rn.skipped_reason, r.reminder_title, r.reminder_date
-- from public.reminder_notifications rn
-- join public.reminders r on r.id = rn.reminder_id
-- where rn.skipped_reason is not null
-- order by rn.scheduled_time desc;
