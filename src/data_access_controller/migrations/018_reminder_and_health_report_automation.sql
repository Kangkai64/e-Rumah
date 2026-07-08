-- Migration 018: Wire up the reminder-email and health-report-status
-- automation that was previously broken (see src/data_access_controller/functions
-- for the edge functions this migration schedules).
--
-- Run this once in the Supabase SQL editor. It:
--   1. Creates health_report_type_validity, referenced by
--      update_health_reports_due_status() but missing from the tracked schema.
--   2. (Re)creates the five "normal" Postgres functions with the fixes
--      described in src/data_access_controller/functions/normal-functions/*.
--   3. Schedules pg_cron jobs to actually run this on a recurring basis -
--      this is the piece that was entirely missing, which is why reminder
--      notifications/emails never fired outside of the one-shot call made at
--      reminder-creation time.
--
-- BEFORE RUNNING:
--  a) Enable pg_cron and pg_net via Database > Extensions in the dashboard
--     (toggle them on there, do NOT run CREATE EXTENSION for them yourself -
--     Supabase's control plane manages permissions/schema for pg_cron
--     specially, and a raw CREATE EXTENSION can collide with that setup:
--     "ERROR 2BP01: dependent privileges exist" is exactly this collision).
--     If `select * from pg_extension where extname in ('pg_cron','pg_net');`
--     already returns rows, they're enabled - skip straight to step (b).
--  b) Fill in the vault secrets near the bottom of this file with your real
--     project ref and service_role key (see TODO list). The cron jobs will
--     fail silently (visible in cron.job_run_details) until those secrets
--     exist.

-- 1. Missing table referenced by update_health_reports_due_status()
CREATE TABLE IF NOT EXISTS public.health_report_type_validity (
  report_type text PRIMARY KEY,
  valid_months integer NOT NULL DEFAULT 3
);

INSERT INTO public.health_report_type_validity (report_type, valid_months) VALUES
  ('Medical Report', 6),
  ('Lab Test', 3),
  ('Prescription', 1),
  ('Vaccination Record', 12),
  ('Doctor''s Visit Summary', 6),
  ('Medical Image', 12)
ON CONFLICT (report_type) DO NOTHING;
-- 'Others' (custom free-text report_type) has no row here on purpose -
-- update_health_reports_due_status() falls back to COALESCE(valid_months, 3).

-- 2a. archive_old_health_reports() - unchanged logic, just formalized with a
-- full CREATE statement so it's tracked (was previously ad hoc / undocumented).
CREATE OR REPLACE FUNCTION public.archive_old_health_reports()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.health_reports
  SET health_report_status = 'Archived',
      updated_at = now()
  WHERE health_report_status = 'Reviewed'
    AND COALESCE(report_date, created_at::date) <= (current_date - INTERVAL '2 years');

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- 2b. update_health_reports_due_status() - unchanged logic; the bug was the
-- missing health_report_type_validity table (created above), not this body.
CREATE OR REPLACE FUNCTION public.update_health_reports_due_status()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  WITH computed AS (
    SELECT
      h.id,
      h.report_date,
      h.report_type,
      COALESCE(v.valid_months, 3) AS valid_months,
      CASE WHEN h.report_date IS NOT NULL THEN (h.report_date + (COALESCE(v.valid_months, 3) || ' months')::interval)::date ELSE NULL END AS expiry_date
    FROM public.health_reports h
    LEFT JOIN public.health_report_type_validity v
      ON v.report_type = h.report_type
  ),
  calculated AS (
    SELECT
      id,
      report_date,
      report_type,
      valid_months,
      expiry_date,
      CASE
        WHEN report_date IS NULL THEN NULL
        WHEN expiry_date <= CURRENT_DATE THEN 'Overdue'
        WHEN expiry_date > CURRENT_DATE AND expiry_date <= (CURRENT_DATE + INTERVAL '1 month') THEN 'Due Soon'
        ELSE 'Up to Date'
      END AS new_due_status
    FROM computed
  ),
  to_update AS (
    SELECT c.id, c.new_due_status
    FROM calculated c
    JOIN public.health_reports h ON h.id = c.id
    WHERE (h.due_status IS DISTINCT FROM c.new_due_status)
  )
  UPDATE public.health_reports h
  SET
    due_status = t.new_due_status,
    updated_at = now()
  FROM to_update t
  WHERE h.id = t.id;
END;
$$;

-- 2c. generate_reminder_notifications() - FIXED: reminder_frequencies is an
-- object of boolean flags ({"enabled_1_week":true,...}), not a JSON array of
-- interval strings, so jsonb_array_elements_text() previously threw on every
-- real row. Now reads the known flag names directly.
-- DROP first: an existing version of this function (with differently-named
-- parameters) is already in the DB, and CREATE OR REPLACE cannot rename
-- input parameters (ERROR 42P13) - only DROP+CREATE can.
DROP FUNCTION IF EXISTS public.generate_reminder_notifications(integer, integer);

CREATE OR REPLACE FUNCTION public.generate_reminder_notifications(
  p_backfill_days integer DEFAULT 1,
  p_horizon_days integer DEFAULT 30
)
RETURNS TABLE(inserted_count integer)
LANGUAGE plpgsql
AS $$
DECLARE
  r RECORD;
  flag RECORD;
  freq_interval INTERVAL;
  sched TIMESTAMPTZ;
  horizon_start TIMESTAMPTZ := now() - (p_backfill_days || ' days')::interval;
  horizon_end TIMESTAMPTZ := CASE WHEN p_horizon_days IS NULL OR p_horizon_days <= 0 THEN NULL ELSE now() + (p_horizon_days || ' days')::interval END;
  v_count INT := 0;
BEGIN
  FOR r IN
    SELECT id, reminder_date, reminder_frequencies
    FROM public.reminders
    WHERE is_enabled = true AND reminder_date IS NOT NULL
  LOOP
    IF r.reminder_frequencies IS NULL THEN
      CONTINUE;
    END IF;

    FOR flag IN
      SELECT * FROM (VALUES
        ('enabled_1_week', interval '7 days'),
        ('enabled_3_days', interval '3 days'),
        ('enabled_1_day',  interval '1 day')
      ) AS t(key, iv)
    LOOP
      IF NOT COALESCE((r.reminder_frequencies->>flag.key)::boolean, false) THEN
        CONTINUE;
      END IF;

      freq_interval := flag.iv;
      sched := r.reminder_date - freq_interval;

      IF horizon_end IS NOT NULL THEN
        IF NOT (sched BETWEEN horizon_start AND horizon_end) THEN
          CONTINUE;
        END IF;
      ELSE
        IF NOT (sched >= horizon_start AND sched <= r.reminder_date) THEN
          CONTINUE;
        END IF;
      END IF;

      IF EXISTS (
        SELECT 1 FROM public.reminder_notifications rn
        WHERE rn.reminder_id = r.id AND date_trunc('second', rn.scheduled_time) = date_trunc('second', sched)
      ) THEN
        CONTINUE;
      END IF;

      INSERT INTO public.reminder_notifications (reminder_id, scheduled_time, notification_offset)
      VALUES (r.id, sched, freq_interval);

      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  inserted_count := v_count;
  RETURN NEXT;
END;
$$;

-- 2d. invoke_update_health_reports_runner() - FIXED: pg_net functions live in
-- the `net` schema (not `pg_net`), http_post returns bigint not jsonb, and
-- vault.secrets holds ciphertext (must read vault.decrypted_secrets instead).
CREATE OR REPLACE FUNCTION public.invoke_update_health_reports_runner()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_url text;
  v_key text;
  v_request_id bigint;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'health_reports_runner_url';
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'health_reports_runner_key';

  IF v_url IS NULL THEN
    RAISE EXCEPTION 'Vault secret health_reports_runner_url not found';
  END IF;

  SELECT net.http_post(
    url := v_url,
    body := jsonb_build_object('run', true),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    )
  ) INTO v_request_id;
END;
$$;

-- 2e. invoke_reminder_processor() - NEW. Same vault-secret pattern as 3d, used
-- so the cron job below doesn't need the service-role key inlined in
-- cron.job (readable by anyone with SELECT on that table).
CREATE OR REPLACE FUNCTION public.invoke_reminder_processor()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_url text;
  v_key text;
  v_request_id bigint;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'reminder_processor_url';
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'reminder_processor_key';

  IF v_url IS NULL THEN
    RAISE EXCEPTION 'Vault secret reminder_processor_url not found';
  END IF;

  SELECT net.http_post(
    url := v_url,
    body := '{}'::jsonb,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_key
    )
  ) INTO v_request_id;
END;
$$;

-- 3. reminders_cleanup_notifications trigger is intentionally NOT recreated
-- here: public.reminder_notifications_reminder_id_fkey already has
-- ON DELETE CASCADE (schema.sql:379), so a BEFORE/AFTER DELETE trigger doing
-- the same DELETE is redundant. If it exists live, drop it instead (the
-- trigger's actual name in the DB is reminders_after_delete_cleanup, not
-- reminders_cleanup_notifications - that's the function name; drop the
-- trigger before the function or DROP FUNCTION fails with 2BP01):
--   DROP TRIGGER IF EXISTS reminders_after_delete_cleanup ON public.reminders;
--   DROP FUNCTION IF EXISTS public.reminders_cleanup_notifications();

-- 4. Vault secrets - REPLACE THE PLACEHOLDER VALUES, then run these once.
-- Get your project ref from Project Settings > General, and the service_role
-- key from Project Settings > API. Do NOT commit real values here - run them
-- directly in the SQL editor and don't paste this filled-in version back into
-- the repo.
-- select vault.create_secret('https://<PROJECT_REF>.supabase.co/functions/v1/update-health-reports-runner', 'health_reports_runner_url');
-- select vault.create_secret('<SERVICE_ROLE_KEY>', 'health_reports_runner_key');
-- select vault.create_secret('https://<PROJECT_REF>.supabase.co/functions/v1/reminder-processor/run', 'reminder_processor_url');
-- select vault.create_secret('<SERVICE_ROLE_KEY>', 'reminder_processor_key');

-- 5. Cron schedules - the actual missing piece. Without these, none of the
-- functions above ever run on their own.
select cron.schedule(
  'generate-reminder-notifications-hourly', '0 * * * *',
  $$ select public.generate_reminder_notifications(1, 30); $$
);

select cron.schedule(
  'invoke-reminder-processor-every-minute', '* * * * *',
  $$ select public.invoke_reminder_processor(); $$
);

select cron.schedule(
  'update-health-reports-due-status-daily', '0 2 * * *',
  $$ select public.update_health_reports_due_status(); $$
);

select cron.schedule(
  'archive-old-health-reports-daily', '30 2 * * *',
  $$ select public.archive_old_health_reports(); $$
);
