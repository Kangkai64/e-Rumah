-- Migration 023: Reverse mortgage provider auction workflow.
--
-- Once an application is approved, an admin can now open it up to competing
-- reverse mortgage providers (a new first-class role, parallel to admins/
-- customer_supports - see providers table below). Providers submit offers
-- (loan_offers), the applicant reviews them and accepts one via the
-- accept_loan_offer() RPC, which atomically rewrites the application's terms
-- from the winning offer and rejects every other submitted offer. Accepting
-- returns applications.status to 'approved', so the existing disbursement
-- flow (LoanDisbursementView / LoanDisbursement.js, keyed entirely off
-- status = 'approved' and approved_amount) picks the application back up
-- unmodified - it doesn't know or care that the amount came from an auction.
--
-- Providers never see applicant identity: getAuctioningApplications-style
-- queries join only to properties, never to users, so no name/IC/contact
-- ever crosses into a provider's session.
--
-- Same RLS gotcha as migrations 021/022: this project enables RLS by default
-- on new tables, so the admin-key/provider-key/applicant-key client (never a
-- service-role key) needs explicit policies for every table below.
--
-- BEFORE RUNNING:
--  a) Confirm in the live Supabase dashboard whether admin SELECT/UPDATE
--     policies on `applications` already exist (schema.sql's checked-in copy
--     only shows owner-scoped policies, yet AdminController already reads/
--     writes every application today - per KNOWN GAPS #3 at the top of
--     schema.sql, an undocumented dashboard-only admin policy most likely
--     already covers this; don't blindly recreate it).
--  b) After running, redeploy the revoke-share-proxy edge function with
--     'auction_opened_at', 'auction_opened_by', 'loan_term_months',
--     'interest_rate', 'accepted_offer_id' added to its applications
--     allowlist (src/data_access_controller/functions/revoke-share-proxy/
--     index.txt is a reference copy only - the live function must be
--     updated and redeployed separately, no CI wires this up).
--  c) Provider accounts are provisioned manually, exactly like admins/
--     customer_supports - create the auth.users row, then insert a matching
--     row into public.providers directly in the SQL editor/dashboard.

-- 1. providers table
CREATE TABLE public.providers (
  id uuid NOT NULL,
  email text NULL,
  company_name text NOT NULL,
  contact_person text NULL,
  phone text NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT providers_pkey PRIMARY KEY (id),
  CONSTRAINT providers_email_key UNIQUE (email),
  CONSTRAINT providers_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE RESTRICT
);
CREATE INDEX idx_providers_is_active ON public.providers USING btree (is_active);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own profile" ON public.providers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Providers can update own profile" ON public.providers
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all providers" ON public.providers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

CREATE POLICY "Admins can manage providers" ON public.providers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

-- 2. loan_offers table - one row per (application, provider), upserted in
-- place as the provider submits/withdraws/resubmits (no bid-history ledger;
-- only the current offer per provider matters for this auction model).
CREATE TABLE public.loan_offers (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  application_id uuid NOT NULL REFERENCES public.applications (id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers (id) ON DELETE CASCADE,
  offer_amount numeric(15, 2) NOT NULL,
  interest_rate numeric(5, 2) NULL,
  loan_term_months integer NOT NULL DEFAULT 240,
  notes text NULL,
  status text NOT NULL DEFAULT 'submitted',
  submitted_at timestamp with time zone NOT NULL DEFAULT now(),
  decided_at timestamp with time zone NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT loan_offers_pkey PRIMARY KEY (id),
  CONSTRAINT loan_offers_application_provider_unique UNIQUE (application_id, provider_id),
  CONSTRAINT loan_offers_offer_amount_check CHECK (offer_amount > 0),
  CONSTRAINT loan_offers_loan_term_months_check CHECK (loan_term_months > 0),
  CONSTRAINT loan_offers_status_check CHECK (
    status = ANY (ARRAY['submitted'::text, 'withdrawn'::text, 'accepted'::text, 'rejected'::text])
  )
);
CREATE INDEX idx_loan_offers_application_id ON public.loan_offers USING btree (application_id);
CREATE INDEX idx_loan_offers_provider_id ON public.loan_offers USING btree (provider_id);
CREATE INDEX idx_loan_offers_status ON public.loan_offers USING btree (status);

ALTER TABLE public.loan_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Providers can view own offers" ON public.loan_offers
  FOR SELECT USING (auth.uid() = provider_id);

-- Bid floor (offer_amount >= the admin's already-approved ceiling) is
-- enforced here in WITH CHECK, not just client-side, so it can't be
-- bypassed by a modified request.
CREATE POLICY "Providers can create own offers" ON public.loan_offers
  FOR INSERT WITH CHECK (
    auth.uid() = provider_id
    AND EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = loan_offers.application_id
        AND applications.status = 'auctioning'
        AND loan_offers.offer_amount >= applications.approved_amount
    )
  );

CREATE POLICY "Providers can update own offers" ON public.loan_offers
  FOR UPDATE USING (auth.uid() = provider_id)
  WITH CHECK (
    auth.uid() = provider_id
    AND EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = loan_offers.application_id
        AND applications.status = 'auctioning'
        AND loan_offers.offer_amount >= applications.approved_amount
    )
  );

CREATE POLICY "Applicants can view offers on own application" ON public.loan_offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = loan_offers.application_id
        AND applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all offers" ON public.loan_offers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

-- Deliberately no applicant UPDATE policy on loan_offers: acceptance goes
-- through accept_loan_offer() below, never a raw client UPDATE, because it
-- must atomically touch both applications and multiple loan_offers rows.

-- 3. applications table changes
ALTER TABLE public.applications
  ADD COLUMN loan_term_months integer NULL,
  ADD COLUMN interest_rate numeric(5, 2) NULL,
  ADD COLUMN accepted_offer_id uuid NULL REFERENCES public.loan_offers (id) ON DELETE SET NULL,
  ADD COLUMN auction_opened_at timestamp with time zone NULL,
  ADD COLUMN auction_opened_by uuid NULL REFERENCES public.admins (id) ON DELETE SET NULL;

ALTER TABLE public.applications DROP CONSTRAINT applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check CHECK (
  status = ANY (ARRAY['draft'::text, 'submitted'::text, 'underReviewed'::text, 'approved'::text, 'auctioning'::text, 'rejected'::text, 'terminated'::text])
);

-- A single 'auctioning' status covers both "open for bids" and "awaiting
-- applicant's pick" - no separate offerSelection state. Extend the
-- one-active-application guard to include it.
DROP INDEX idx_one_active_application;
CREATE UNIQUE INDEX idx_one_active_application ON public.applications USING btree (user_id)
  WHERE (status = ANY (ARRAY['approved'::text, 'underReviewed'::text, 'auctioning'::text]));

-- 4. accept_loan_offer() - atomic accept + reject-the-rest + status flip.
-- Needed as a SECURITY DEFINER RPC (not 2-3 separate client PATCH calls)
-- because acceptance must rewrite applications AND flip the winning offer
-- AND reject every other submitted offer, atomically. FOR UPDATE row locks
-- plus the status guards make this race-safe against double-clicks/tabs,
-- mirroring the claim-then-act pattern LoanDisbursement.confirmScheduledDisbursement
-- already uses at the JS layer, done properly at the DB layer since this
-- needs atomicity across two tables.
CREATE OR REPLACE FUNCTION public.accept_loan_offer(p_offer_id uuid)
RETURNS public.applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_offer public.loan_offers;
  v_application public.applications;
BEGIN
  SELECT * INTO v_offer FROM loan_offers WHERE id = p_offer_id FOR UPDATE;
  IF v_offer IS NULL THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  SELECT * INTO v_application FROM applications WHERE id = v_offer.application_id FOR UPDATE;

  IF v_application.user_id != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to accept offers on this application';
  END IF;
  IF v_application.status != 'auctioning' THEN
    RAISE EXCEPTION 'Application is not open for offer selection';
  END IF;
  IF v_offer.status != 'submitted' THEN
    RAISE EXCEPTION 'Offer is no longer available';
  END IF;

  UPDATE applications SET
    status = 'approved',
    approved_amount = v_offer.offer_amount,
    loan_term_months = v_offer.loan_term_months,
    interest_rate = v_offer.interest_rate,
    accepted_offer_id = v_offer.id,
    updated_at = now()
  WHERE id = v_application.id
  RETURNING * INTO v_application;

  UPDATE loan_offers SET status = 'accepted', decided_at = now(), updated_at = now()
  WHERE id = v_offer.id;

  UPDATE loan_offers SET status = 'rejected', decided_at = now(), updated_at = now()
  WHERE application_id = v_application.id AND id != v_offer.id AND status = 'submitted';

  RETURN v_application;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.accept_loan_offer(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.accept_loan_offer(uuid) TO authenticated;

COMMENT ON FUNCTION public.accept_loan_offer IS 'Applicant accepts one submitted loan_offer: atomically rewrites applications terms, flips the winner to accepted, rejects every other submitted offer for that application, and returns applications.status to approved.';

-- 5. check_duplicate_email() - include providers in the duplicate-email union
-- so a provider's email can't collide undetected with an existing account.
CREATE OR REPLACE FUNCTION check_duplicate_email(email_to_check text, exclude_user_id uuid DEFAULT NULL)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized text;
  exists_flag boolean;
BEGIN
  normalized := public.normalize_email(email_to_check);

  SELECT EXISTS (
    SELECT 1 FROM users
      WHERE public.normalize_email(email) = normalized
        AND (exclude_user_id IS NULL OR id != exclude_user_id)
    UNION ALL
    SELECT 1 FROM admins
      WHERE public.normalize_email(email) = normalized
        AND (exclude_user_id IS NULL OR id != exclude_user_id)
    UNION ALL
    SELECT 1 FROM customer_supports
      WHERE public.normalize_email(email) = normalized
        AND (exclude_user_id IS NULL OR id != exclude_user_id)
    UNION ALL
    SELECT 1 FROM providers
      WHERE public.normalize_email(email) = normalized
        AND (exclude_user_id IS NULL OR id != exclude_user_id)
  ) INTO exists_flag;

  RETURN exists_flag;
END;
$$;

-- 6. generate_due_loan_disbursements() (migration 021) hardcodes 240 months;
-- update it to prefer the accepted offer's loan_term_months so an auctioned
-- application's pg_cron auto-schedule doesn't silently revert to 240 months
-- while the UI shows the accepted term. Legacy applications keep
-- loan_term_months NULL forever, so COALESCE(NULLIF(...), 240) preserves
-- today's behavior for every application that never goes through an auction.
CREATE OR REPLACE FUNCTION public.generate_due_loan_disbursements()
RETURNS integer
LANGUAGE plpgsql
AS $$
DECLARE
  app RECORD;
  v_approved_amount numeric;
  v_loan_term_months integer;
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
      a.loan_term_months,
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

    v_loan_term_months := COALESCE(NULLIF(app.loan_term_months, 0), 240);
    v_monthly_amount := v_approved_amount / v_loan_term_months;

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
