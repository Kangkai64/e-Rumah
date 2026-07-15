-- Migration 029: admin_health_report_view is missing columns that exist on
-- health_reports, including due_status. Migration 018 wired up the cron job
-- that keeps health_reports.due_status current, but never updated this view,
-- so the admin dashboard always reads due_status as NULL/undefined - this is
-- why the "Overdue Health Report" / "Health Report Due Soon" admin stat cards
-- (and the Overdue/Due Soon tabs) always show 0 regardless of real data.
--
-- Also picks up report_file_url, notes, application_id, flagged_reason, and
-- updated_at, which admin report viewing/notes/flag-reason display silently
-- depend on via the same view.
--
-- Run this once in the Supabase SQL editor.

CREATE OR REPLACE VIEW public.admin_health_report_view AS
SELECT
  hr.id AS health_report_id,
  hr.user_id,
  u.email AS user_email,
  u.full_name AS user_full_name,
  u.ic_number,
  u.phone,
  hr.application_id,
  hr.report_date,
  hr.report_type,
  hr.report_title,
  hr.report_file_url,
  hr.notes,
  hr.provider_name,
  hr.health_report_status,
  hr.due_status,
  hr.flagged_reason,
  hr.created_at AS report_created_at,
  hr.updated_at AS report_updated_at
FROM
  public.health_reports hr
  LEFT JOIN public.users u ON u.id = hr.user_id;
