-- Migration 022: Admin-scheduled property valuations.
--
-- Applicants can now leave the Valuation Report document blank at submission
-- (see applicationValidation.js: formData.valuationReportPending) and check a
-- box saying they need one arranged. This migration adds the table admins use
-- to record the appointment with a partner valuer and, once the valuer is
-- done, the result. Completing a valuation writes the actual document via the
-- normal storage upload path (uploadDocument(file, userId, 'valuationReport')),
-- so it is picked up automatically by Application.getRequiredDocuments's
-- filename-prefix match - no schema change needed for that part.
--
-- Same RLS gotcha as migration 021: this project enables RLS by default on
-- new tables, so the admin UI (which talks to Postgres through the anon-key
-- client, never a service-role key) needs explicit policies. Unlike
-- loan_disbursement_schedules (cron-only inserts), admins here also need a
-- client-side INSERT policy since they schedule valuations interactively.

-- 1. Schedule table
CREATE TABLE public.property_valuation_schedules (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  application_id uuid NOT NULL REFERENCES public.applications (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'scheduled',
  scheduled_date timestamp with time zone NOT NULL,
  valuer_name text NULL,
  valuer_contact text NULL,
  location_notes text NULL,
  scheduled_by uuid NULL REFERENCES public.admins (id) ON DELETE SET NULL,
  completed_at timestamp with time zone NULL,
  completed_by uuid NULL REFERENCES public.admins (id) ON DELETE SET NULL,
  result_value numeric(15, 2) NULL,
  cancelled_reason text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT property_valuation_schedules_pkey PRIMARY KEY (id),
  CONSTRAINT property_valuation_schedules_status_check CHECK (
    status = ANY (ARRAY['scheduled'::text, 'completed'::text, 'cancelled'::text])
  )
);
CREATE INDEX idx_property_valuation_schedules_application_id ON public.property_valuation_schedules USING btree (application_id);
CREATE INDEX idx_property_valuation_schedules_status ON public.property_valuation_schedules USING btree (status);
CREATE INDEX idx_property_valuation_schedules_scheduled_date ON public.property_valuation_schedules USING btree (scheduled_date);

ALTER TABLE public.property_valuation_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own valuation schedule" ON public.property_valuation_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = property_valuation_schedules.application_id
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );

CREATE POLICY "Admins can view all valuation schedules" ON public.property_valuation_schedules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

CREATE POLICY "Admins can insert valuation schedules" ON public.property_valuation_schedules
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

CREATE POLICY "Admins can update valuation schedules" ON public.property_valuation_schedules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

-- 2. Admins currently have no way to update public.properties (only the
-- owning applicant can, per "Users can update properties for own
-- applications"). completeValuation() needs to write
-- indicative_market_value/valuation_date as the admin once the valuer's
-- result comes in, so add an explicit admin policy rather than relying on
-- undocumented dashboard-added policies (see the KNOWN GAPS note at the top
-- of schema.sql, which only confirms this exists for public.applications).
CREATE POLICY "Admins can update properties" ON public.properties
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );
