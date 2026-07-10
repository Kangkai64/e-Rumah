-- Migration 021: Automatic monthly loan disbursement scheduling.
--
-- Today every disbursement is a fully manual admin action (LoanDisbursementController
-- inserts straight into public.transactions with no persisted schedule - see
-- src/models/LoanDisbursement.js). This migration adds a persisted schedule table plus
-- the cron automation to auto-generate the *pending* monthly disbursement for every
-- approved application, using the exact pg_cron + pg_net + vault-secret + edge-function
-- pattern already used for reminders/health-reports (see migration 018).
--
-- IMPORTANT: automatic entries are created with status = 'pending', NOT inserted as
-- real transactions. This app has no real bank-transfer integration, so a transactions
-- row asserts that money has actually moved - only an admin confirming (after the real
-- bank transfer happens, via the existing "Confirm & Record" flow) creates the actual
-- transactions row and flips the schedule to 'confirmed'. Manual/ad-hoc disbursement
-- entry (LoanDisbursement.createDisbursement) is unchanged and still available for
-- corrections, off-cycle amounts, or loans outside the auto-schedule.
--
-- BEFORE RUNNING:
--  a) pg_cron and pg_net must already be enabled (see migration 018 if not).
--  b) Fill in the vault secrets near the bottom of this file for the new
--     loan-disbursement-notifier edge function, then run them once in the SQL editor.

-- 1. Schedule table
CREATE TABLE public.loan_disbursement_schedules (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  application_id uuid NOT NULL REFERENCES public.applications (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  disbursement_number integer NOT NULL,
  scheduled_date date NOT NULL,
  amount numeric(15, 2) NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  transaction_id uuid NULL REFERENCES public.transactions (id) ON DELETE SET NULL,
  confirmed_by uuid NULL REFERENCES public.admins (id) ON DELETE SET NULL,
  confirmed_at timestamp with time zone NULL,
  notified_at timestamp with time zone NULL,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT loan_disbursement_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT loan_disbursement_schedules_app_number_unique UNIQUE (application_id, disbursement_number),
  CONSTRAINT loan_disbursement_schedules_status_check CHECK (
    status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'skipped'::text, 'cancelled'::text])
  )
);
CREATE INDEX idx_loan_disbursement_schedules_application_id ON public.loan_disbursement_schedules USING btree (application_id);
CREATE INDEX idx_loan_disbursement_schedules_status ON public.loan_disbursement_schedules USING btree (status);
CREATE INDEX idx_loan_disbursement_schedules_scheduled_date ON public.loan_disbursement_schedules USING btree (scheduled_date);
CREATE INDEX idx_loan_disbursement_schedules_pending_notify ON public.loan_disbursement_schedules USING btree (status, notified_at) WHERE (status = 'pending');

-- This project enables RLS by default on new tables (verified empirically: a
-- freshly created table with no ALTER TABLE ... ENABLE ROW LEVEL SECURITY
-- statement still rejected all reads/writes from the anon/authenticated
-- roles). The admin UI (LoanDisbursementController) talks to Postgres through
-- the anon-key client, never a service-role key, so it needs explicit
-- policies here - the cron-generated INSERTs run as the Postgres/cron job
-- owner and bypass RLS entirely, so no INSERT policy is needed for the app.
ALTER TABLE public.loan_disbursement_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all disbursement schedules" ON public.loan_disbursement_schedules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

CREATE POLICY "Admins can update disbursement schedules" ON public.loan_disbursement_schedules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

-- 2. generate_due_loan_disbursements() - for every approved application, catch up all
-- owed monthly slots up to today by inserting 'pending' schedule rows. Mirrors the
-- amount/date math in resolveApprovedAmount/resolveMonthlyAmount/addMonths in
-- src/models/LoanDisbursement.js. Safe to run repeatedly/daily - ON CONFLICT DO NOTHING
-- on (application_id, disbursement_number) makes it a no-op once caught up.
CREATE OR REPLACE FUNCTION public.generate_due_loan_disbursements()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  app RECORD;
  v_approved_amount numeric;
  v_monthly_amount numeric;
  v_total_disbursed numeric;
  v_remaining numeric;
  v_next_number integer;
  v_next_date date;
  v_amount numeric;
  v_inserted integer;
  v_total_inserted integer := 0;
BEGIN
  FOR app IN
    SELECT
      a.id,
      a.user_id,
      a.approved_at,
      a.approved_amount,
      p.expected_market_value,
      p.indicative_market_value
    FROM public.applications a
    LEFT JOIN public.properties p ON p.application_id = a.id
    WHERE a.status = 'approved' AND a.approved_at IS NOT NULL
  LOOP
    v_approved_amount := COALESCE(
      NULLIF(app.approved_amount, 0),
      COALESCE(NULLIF(app.expected_market_value, 0), NULLIF(app.indicative_market_value, 0), 0) * 0.7
    );

    IF v_approved_amount <= 0 THEN
      CONTINUE;
    END IF;

    v_monthly_amount := v_approved_amount / 240;

    SELECT COALESCE(SUM(t.amount), 0) INTO v_total_disbursed
    FROM public.transactions t
    WHERE t.application_id = app.id AND t.transaction_type = 'payout';

    v_remaining := v_approved_amount - v_total_disbursed;
    IF v_remaining <= 0 THEN
      CONTINUE;
    END IF;

    SELECT COALESCE(MAX(disbursement_number), 0) + 1 INTO v_next_number
    FROM public.loan_disbursement_schedules
    WHERE application_id = app.id;

    v_next_date := (app.approved_at::date + (v_next_number || ' months')::interval)::date;

    WHILE v_next_date <= CURRENT_DATE AND v_remaining > 0 LOOP
      v_amount := LEAST(v_monthly_amount, v_remaining);

      INSERT INTO public.loan_disbursement_schedules (
        application_id, user_id, disbursement_number, scheduled_date, amount, status
      ) VALUES (
        app.id, app.user_id, v_next_number, v_next_date, v_amount, 'pending'
      )
      ON CONFLICT (application_id, disbursement_number) DO NOTHING;

      GET DIAGNOSTICS v_inserted = ROW_COUNT;
      v_total_inserted := v_total_inserted + v_inserted;

      v_remaining := v_remaining - v_amount;
      v_next_number := v_next_number + 1;
      v_next_date := (app.approved_at::date + (v_next_number || ' months')::interval)::date;
    END LOOP;
  END LOOP;

  RETURN v_total_inserted;
END;
$$;

-- 3. invoke_loan_disbursement_notifier() - same vault-secret + net.http_post shape as
-- invoke_reminder_processor() (migration 018), so the service-role key never sits
-- directly in cron.job.
CREATE OR REPLACE FUNCTION public.invoke_loan_disbursement_notifier()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_url text;
  v_key text;
  v_request_id bigint;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'loan_disbursement_notifier_url';
  SELECT decrypted_secret INTO v_key FROM vault.decrypted_secrets WHERE name = 'loan_disbursement_notifier_key';

  IF v_url IS NULL THEN
    RAISE EXCEPTION 'Vault secret loan_disbursement_notifier_url not found';
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

-- 4. Vault secrets - REPLACE THE PLACEHOLDER VALUES, then run these once in the SQL
-- editor. Do NOT commit real values here.
-- select vault.create_secret('https://<PROJECT_REF>.supabase.co/functions/v1/loan-disbursement-notifier/run', 'loan_disbursement_notifier_url');
-- select vault.create_secret('<SERVICE_ROLE_KEY>', 'loan_disbursement_notifier_key');

-- 5. Cron schedules
select cron.schedule(
  'generate-due-loan-disbursements-daily', '0 3 * * *',
  $$ select public.generate_due_loan_disbursements(); $$
);

select cron.schedule(
  'invoke-loan-disbursement-notifier-daily', '30 3 * * *',
  $$ select public.invoke_loan_disbursement_notifier(); $$
);
