-- e-Rumah Database Schema (consolidated)
--
-- KNOWN GAPS (schema elements referenced here that were created directly in
-- the Supabase dashboard and are not fully documented in any migration):
--   1. applications.flagged_code is typed `public.flagged_code`, a custom
--      enum with no CREATE TYPE statement anywhere in this repo's history.
--      Create it manually (check the live dashboard for its allowed values)
--      before running this file on a fresh database.
--   2. handle_new_auth_user() (see FUNCTIONS below) is meant to run via an
--      `on_auth_user_created` trigger on auth.users, but no CREATE TRIGGER
--      statement for it exists in this repo - it was wired up directly in
--      the dashboard. You must create that trigger manually:
--        CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
--          FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();
--   1b. care_services.caregiver_id/healthcare_provider_id had no FK
--       constraints on an already-live database until
--       migrations/032_care_services_add_foreign_keys.sql. Run that
--       migration against any existing database - this file's CREATE TABLE
--       is only accurate for a fresh database.
--   3. Several tables added later (admins, customer_supports, user_bank_details,
--      reminders, reminder_notifications, reports) have no RLS policies
--      defined anywhere in this repo's history. Only the tables covered
--      below have RLS enabled with policies. caregivers, healthcare_providers,
--      family_members, and care_services used to be in this list too, but
--      got RLS policies via migrations/030_care_and_family_share_rls.sql -
--      see the "Care coordination" RLS block below.
--   4. applications.nominee_change_pending/nominee_change_submitted_at/
--      nominee_change_reviewed_at/nominee_change_reviewed_by/
--      nominee_change_rejected_reason were added to an already-live database
--      via a manual ALTER TABLE (this file's CREATE TABLE is only accurate
--      for a fresh database). Run this against any existing database:
--        ALTER TABLE public.applications
--          ADD COLUMN nominee_change_pending boolean NULL DEFAULT false,
--          ADD COLUMN nominee_change_submitted_at timestamp with time zone NULL,
--          ADD COLUMN nominee_change_reviewed_at timestamp with time zone NULL,
--          ADD COLUMN nominee_change_reviewed_by uuid NULL,
--          ADD COLUMN nominee_change_rejected_reason text NULL;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================
-- TABLES
-- =============================================================

-- ---- Users & role tables ----

CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL,
  full_name text NULL,
  ic_number text NOT NULL,
  phone text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id, ic_number),
  CONSTRAINT users_email_key UNIQUE (email),
  CONSTRAINT users_id_unique UNIQUE (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);
CREATE INDEX idx_users_email ON public.users USING btree (email);

CREATE TABLE public.admins (
  id uuid NOT NULL,
  email text NULL,
  type text NULL,
  full_name text NULL,
  phone text NULL,
  created_at timestamp with time zone NULL,
  updated_at timestamp with time zone NULL,
  CONSTRAINT admin_pkey PRIMARY KEY (id),
  CONSTRAINT admin_email_key UNIQUE (email),
  CONSTRAINT admin_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE public.customer_supports (
  id uuid NOT NULL,
  email text NULL,
  full_name text NULL,
  phone text NULL,
  created_at timestamp with time zone NULL,
  updated_at timestamp with time zone NULL,
  role text NULL,
  CONSTRAINT customer_support_pkey PRIMARY KEY (id),
  CONSTRAINT customer_support_email_key UNIQUE (email)
);

-- Reverse mortgage providers (see migrations/023_*.sql) - a third staff-like
-- role, manually provisioned exactly like admins/customer_supports, that
-- submits competing loan_offers on applications an admin has opened for
-- auction.
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

CREATE TABLE public.caregivers (
  id uuid NOT NULL,
  license_number text NULL,
  specialization text NULL,
  years_of_experience integer NULL,
  bio text NULL,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT caregivers_pkey PRIMARY KEY (id),
  CONSTRAINT caregivers_id_fkey FOREIGN KEY (id) REFERENCES public.users (id) ON DELETE CASCADE
);
CREATE INDEX idx_caregivers_user_id ON public.caregivers USING btree (id);
CREATE INDEX idx_caregivers_is_verified ON public.caregivers USING btree (is_verified);

CREATE TABLE public.healthcare_providers (
  id uuid NOT NULL,
  provider_type text NOT NULL DEFAULT 'doctor'::text,
  license_number text NULL,
  specialty text NULL,
  organization_name text NULL,
  address text NULL,
  is_verified boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT healthcare_providers_pkey PRIMARY KEY (id),
  CONSTRAINT healthcare_providers_id_fkey FOREIGN KEY (id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT healthcare_providers_type_check CHECK (
    provider_type = ANY (ARRAY['doctor'::text, 'nurse'::text, 'clinic'::text, 'hospital'::text, 'therapist'::text])
  )
);
CREATE INDEX idx_healthcare_providers_user_id ON public.healthcare_providers USING btree (id);
CREATE INDEX idx_healthcare_providers_type ON public.healthcare_providers USING btree (provider_type);
CREATE INDEX idx_healthcare_providers_is_verified ON public.healthcare_providers USING btree (is_verified);

CREATE TABLE public.family_members (
  id uuid NOT NULL,
  family_member_user_id uuid NOT NULL,
  relationship_type text NOT NULL,
  is_emergency_contact boolean NOT NULL DEFAULT false,
  is_verified boolean NOT NULL DEFAULT false,
  permissions_level text NOT NULL DEFAULT 'view'::text,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT family_members_unique_relationship UNIQUE (id, family_member_user_id),
  CONSTRAINT family_members_family_user_id_fkey FOREIGN KEY (family_member_user_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT family_members_id_fkey FOREIGN KEY (id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT family_members_not_self CHECK ((id <> family_member_user_id)),
  CONSTRAINT family_members_permissions_check CHECK (
    permissions_level = ANY (ARRAY['view'::text, 'view_and_share'::text, 'full'::text])
  ),
  CONSTRAINT family_members_relationship_check CHECK (
    relationship_type = ANY (ARRAY['spouse'::text, 'partner'::text, 'parent'::text, 'child'::text, 'sibling'::text, 'grandparent'::text, 'grandchild'::text, 'other'::text])
  )
);
CREATE INDEX idx_family_members_user_id ON public.family_members USING btree (id);
CREATE INDEX idx_family_members_family_user_id ON public.family_members USING btree (family_member_user_id);
CREATE INDEX idx_family_members_relationship ON public.family_members USING btree (relationship_type);
CREATE INDEX idx_family_members_emergency ON public.family_members USING btree (is_emergency_contact);
CREATE INDEX idx_family_members_verified ON public.family_members USING btree (is_verified);

CREATE TABLE public.user_bank_details (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  account_holder_name text NOT NULL,
  bank_name text NOT NULL,
  bank_account_number text NOT NULL,
  account_type text NULL,
  is_primary boolean NOT NULL DEFAULT true,
  is_verified boolean NOT NULL DEFAULT false,
  verified_at timestamp with time zone NULL,
  notes text NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_bank_details_pkey PRIMARY KEY (id),
  CONSTRAINT user_bank_details_user_account_unique UNIQUE (user_id, bank_account_number),
  CONSTRAINT user_bank_details_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE
);
CREATE INDEX idx_user_bank_details_user_id ON public.user_bank_details USING btree (user_id);
CREATE INDEX idx_user_bank_details_is_primary ON public.user_bank_details USING btree (is_primary);

-- ---- Applications & property ----

CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  joint_user_id uuid NULL,
  status text NOT NULL DEFAULT 'draft'::text,
  remarks text NULL,
  main_applicant_deceased boolean NULL DEFAULT false,
  submitted_at timestamp with time zone NULL,
  reviewed_at timestamp with time zone NULL,
  approved_at timestamp with time zone NULL,
  rejected_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  is_flagged boolean NULL DEFAULT false,
  flagged_reason text NULL,
  flagged_at timestamp with time zone NULL,
  flagged_by uuid NULL,
  flagged_code public.flagged_code NULL, -- see KNOWN GAPS #1 at top of file
  termination_reason text NULL,
  termination_submitted_at timestamp with time zone NULL,
  termination_update_at timestamp with time zone NULL,
  approved_amount numeric NULL,
  reject_termination_reason text NULL,
  loan_term_months integer NULL,
  interest_rate numeric(5, 2) NULL,
  accepted_offer_id uuid NULL,
  auction_opened_at timestamp with time zone NULL,
  auction_opened_by uuid NULL,
  cancellation_reason text NULL,
  cancelled_at timestamp with time zone NULL,
  nominee_change_pending boolean NULL DEFAULT false,
  nominee_change_submitted_at timestamp with time zone NULL,
  nominee_change_reviewed_at timestamp with time zone NULL,
  nominee_change_reviewed_by uuid NULL, -- no FK: customer_supports staff aren't guaranteed rows in admins
  nominee_change_rejected_reason text NULL,
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES public.admins (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT applications_joint_user_id_fkey FOREIGN KEY (joint_user_id) REFERENCES public.users (id) ON DELETE SET NULL,
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT applications_auction_opened_by_fkey FOREIGN KEY (auction_opened_by) REFERENCES public.admins (id) ON DELETE SET NULL,
  CONSTRAINT applications_approved_amount_check CHECK ((approved_amount > (0)::numeric)),
  CONSTRAINT applications_status_check CHECK (
    status = ANY (ARRAY['draft'::text, 'submitted'::text, 'underReviewed'::text, 'approved'::text, 'auctioning'::text, 'rejected'::text, 'terminated'::text, 'cancelled'::text])
  )
  -- accepted_offer_id -> public.loan_offers (id) ON DELETE SET NULL is added
  -- as a separate ALTER TABLE after loan_offers is created below, since
  -- loan_offers itself references applications (see migrations/023_*.sql).
);
CREATE INDEX idx_applications_flagged ON public.applications USING btree (is_flagged) WHERE (is_flagged = true);
CREATE INDEX idx_applications_user_id ON public.applications USING btree (user_id);
CREATE INDEX idx_applications_status ON public.applications USING btree (status);
-- 'auctioning' included so a user can't have two applications mid-auction.
CREATE UNIQUE INDEX idx_one_active_application ON public.applications USING btree (user_id) WHERE (status = ANY (ARRAY['approved'::text, 'underReviewed'::text, 'auctioning'::text]));

CREATE TABLE public.application_data (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid UNIQUE NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  current_step integer DEFAULT 1 CHECK (current_step BETWEEN 1 AND 7),
  form_data jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_application_data_application_id ON public.application_data(application_id);
CREATE INDEX idx_application_data_form_data ON public.application_data USING GIN (form_data);

CREATE TABLE public.nominees (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('nominee1', 'nominee2')),
  salutation text,
  name text NOT NULL,
  ic_number text NOT NULL,
  address text,
  postcode text,
  email text,
  residence_phone text,
  telephone text,
  dob_day text,
  dob_month text,
  dob_year text,
  sex text,
  race text,
  is_malaysian boolean DEFAULT false,
  marital_status text,
  relationship text,
  occupation text,
  employer_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_nominees_application_id ON public.nominees(application_id);

CREATE TABLE public.properties (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id uuid UNIQUE NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
  property_type text,
  address text NOT NULL,
  postcode text,
  indicative_market_value numeric(15, 2),
  valuation_date date,
  expected_market_value numeric(15, 2),
  purchase_price numeric(15, 2),
  purchase_date date,
  tenure_title text,
  expiry_date date,
  build_up_area numeric(10, 2),
  land_area numeric(10, 2),
  is_encumbered boolean,
  bank_name text,
  est_outstanding_balance numeric(15, 2),
  has_fire_insurance boolean,
  insurance_company text,
  insurance_period_validity text,
  scheme_name text,
  district text,
  mukim text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_properties_application_id ON public.properties(application_id);
COMMENT ON COLUMN public.properties.scheme_name IS 'Scheme / Taman name, used as an input to the property value estimator';
COMMENT ON COLUMN public.properties.district IS 'District, used as an input to the property value estimator';
COMMENT ON COLUMN public.properties.mukim IS 'Mukim, used as an input to the property value estimator';

-- Property valuation scheduling (see migrations/022_*.sql): admin-managed
-- appointments for a partner valuer, used when an applicant leaves the
-- Valuation Report document blank at submission.
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
  result_property_age integer NULL,
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

CREATE TABLE public.transactions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  application_id uuid REFERENCES public.applications(id) ON DELETE SET NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('payout', 'refund', 'fee', 'other')),
  amount numeric(15, 2) NOT NULL,
  transaction_date date NOT NULL,
  description text,
  reference_number text,
  created_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX idx_transactions_application_id ON public.transactions(application_id);

-- ---- Health ----

CREATE TABLE public.health_reports (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  application_id uuid NULL,
  report_date date NOT NULL,
  report_type text NULL,
  report_file_url text NULL,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  health_report_status text NOT NULL DEFAULT 'Pending'::text,
  due_status text NULL,
  report_title text NULL,
  provider_name text NULL,
  flagged_reason text NULL,
  CONSTRAINT health_reports_pkey PRIMARY KEY (id),
  CONSTRAINT health_reports_application_id_fkey FOREIGN KEY (application_id) REFERENCES public.applications (id) ON DELETE SET NULL,
  CONSTRAINT health_reports_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT health_reports_due_status_check CHECK (
    due_status = ANY (ARRAY['Overdue'::text, 'Due Soon'::text, 'Up to Date'::text])
  ),
  CONSTRAINT health_reports_health_report_status_check CHECK (
    health_report_status = ANY (ARRAY['Pending'::text, 'Reviewed'::text, 'Flagged'::text, 'Archived'::text])
  )
);
CREATE INDEX idx_health_reports_due_status ON public.health_reports USING btree (due_status);
CREATE INDEX idx_health_reports_health_report_status ON public.health_reports USING btree (health_report_status);
CREATE INDEX idx_health_reports_statuses ON public.health_reports USING btree (health_report_status, due_status);
CREATE INDEX idx_health_reports_report_title ON public.health_reports USING gin (to_tsvector('english'::regconfig, report_title));
CREATE INDEX idx_health_reports_user_id ON public.health_reports USING btree (user_id);
CREATE INDEX idx_health_reports_application_id ON public.health_reports USING btree (application_id);
CREATE INDEX idx_health_reports_provider_name ON public.health_reports USING gin (to_tsvector('english'::regconfig, provider_name));
COMMENT ON COLUMN public.health_reports.report_title IS 'User-provided title for the health report';
COMMENT ON COLUMN public.health_reports.provider_name IS 'Name of the healthcare provider or facility that issued the report';

CREATE TABLE public.health_report_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  shared_by_user_id uuid NOT NULL,
  shared_with_type text NOT NULL,
  shared_with_id uuid NULL,
  shared_with_email text NULL,
  expires_at timestamp with time zone NULL,
  is_revoked boolean NOT NULL DEFAULT false,
  access_count integer NOT NULL DEFAULT 0,
  last_accessed_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  share_token text NOT NULL,
  CONSTRAINT health_report_shares_pkey PRIMARY KEY (id),
  CONSTRAINT health_report_shares_share_token_key UNIQUE (share_token),
  CONSTRAINT health_report_shares_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.health_reports (id) ON DELETE CASCADE,
  CONSTRAINT health_report_shares_shared_by_fkey FOREIGN KEY (shared_by_user_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT health_report_shares_type_check CHECK (
    shared_with_type = ANY (ARRAY['caregiver'::text, 'family'::text, 'healthcare_provider'::text, 'link'::text, 'email'::text])
  )
);
CREATE INDEX idx_health_report_shares_report_id ON public.health_report_shares USING btree (report_id);
CREATE INDEX idx_health_report_shares_shared_by ON public.health_report_shares USING btree (shared_by_user_id);
CREATE INDEX idx_health_report_shares_shared_with ON public.health_report_shares USING btree (shared_with_id);
CREATE INDEX idx_health_report_shares_email ON public.health_report_shares USING btree (shared_with_email);
CREATE INDEX idx_health_report_shares_expires_at ON public.health_report_shares USING btree (expires_at);
CREATE INDEX idx_health_report_shares_type ON public.health_report_shares USING btree (shared_with_type);
CREATE INDEX idx_health_report_shares_composite ON public.health_report_shares USING btree (report_id, shared_with_type, shared_with_id);
CREATE UNIQUE INDEX uniq_health_report_shares_share_token ON public.health_report_shares USING btree (share_token) WHERE (share_token IS NOT NULL);

CREATE TABLE public.reminders (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  reminder_type text NOT NULL,
  reminder_title text NOT NULL,
  reminder_date timestamp with time zone NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  reminder_frequencies jsonb NULL,
  category text NULL DEFAULT 'Health & appointments'::text,
  notes text NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  notified_at timestamp with time zone NULL,
  CONSTRAINT reminders_pkey PRIMARY KEY (id),
  CONSTRAINT reminders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT reminders_category_check CHECK (
    category = ANY (ARRAY['Health & appointments'::text, 'Medication'::text, 'Personal'::text, 'Other'::text])
  ),
  CONSTRAINT reminders_reminder_type_check CHECK (
    reminder_type = ANY (ARRAY['Next health check'::text, 'Medication refill'::text, 'Blood pressure check'::text, 'Doctor visit'::text, 'Vaccination'::text, 'Lab test'::text, 'Custom'::text])
  )
);
CREATE INDEX idx_reminders_user_id ON public.reminders USING btree (user_id);
CREATE INDEX idx_reminders_reminder_date ON public.reminders USING btree (reminder_date);
CREATE INDEX idx_reminders_is_enabled ON public.reminders USING btree (is_enabled);
CREATE INDEX idx_reminders_user_date ON public.reminders USING btree (user_id, reminder_date);
CREATE INDEX idx_reminders_category ON public.reminders USING btree (category);
CREATE INDEX idx_reminders_type ON public.reminders USING btree (reminder_type);

CREATE TABLE public.reminder_notifications (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  reminder_id uuid NOT NULL,
  scheduled_time timestamp with time zone NOT NULL,
  notification_offset interval NOT NULL,
  is_sent boolean NOT NULL DEFAULT false,
  sent_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  skipped_reason text NULL,
  CONSTRAINT reminder_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT reminder_notifications_reminder_id_fkey FOREIGN KEY (reminder_id) REFERENCES public.reminders (id) ON DELETE CASCADE
);
CREATE INDEX idx_reminder_notifications_reminder_id ON public.reminder_notifications USING btree (reminder_id);
CREATE INDEX idx_reminder_notifications_scheduled_time ON public.reminder_notifications USING btree (scheduled_time);
CREATE INDEX idx_reminder_notifications_is_sent ON public.reminder_notifications USING btree (is_sent);
CREATE INDEX idx_reminder_notifications_pending ON public.reminder_notifications USING btree (is_sent, scheduled_time) WHERE (is_sent = false);

-- ---- Support ----

CREATE TABLE public.customer_support_inquiries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  message text NOT NULL,
  status text DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assigned_to uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
CREATE INDEX idx_customer_support_user_id ON public.customer_support_inquiries(user_id);
CREATE INDEX idx_customer_support_status ON public.customer_support_inquiries(status);

-- entity_type/entity_id link a message to its inquiry/nominee/health_report
-- (see support_conversations RLS policies below for how entity access is scoped).
-- sender_id references auth.users (not public.users) because staff accounts
-- (admins/customer_supports) only exist in auth.users.
CREATE TABLE public.support_conversations (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  message text NOT NULL,
  sender_type text NOT NULL DEFAULT 'staff'::text,
  sender_id uuid NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT support_conversations_pkey PRIMARY KEY (id),
  CONSTRAINT support_conversations_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT support_conversations_entity_type_check CHECK (
    entity_type = ANY (ARRAY['inquiry'::text, 'nominee'::text, 'health_report'::text])
  ),
  CONSTRAINT support_conversations_sender_type_check CHECK (
    sender_type = ANY (ARRAY['elder'::text, 'staff'::text])
  )
);
CREATE INDEX idx_support_conversations_entity ON public.support_conversations USING btree (entity_type, entity_id);
CREATE INDEX idx_support_conversations_sender ON public.support_conversations USING btree (sender_id);

-- ---- Care coordination & reporting ----

CREATE TABLE public.care_services (
  service_id uuid NOT NULL DEFAULT gen_random_uuid(),
  caregiver_id uuid NOT NULL,
  healthcare_provider_id uuid NOT NULL,
  elder_id uuid NOT NULL,
  description text NULL,
  start_date date NOT NULL,
  end_date date NULL,
  cost numeric NULL,
  attachment_link text NULL,
  CONSTRAINT care_service_pkey PRIMARY KEY (service_id),
  CONSTRAINT care_service_elder_id_fkey FOREIGN KEY (elder_id) REFERENCES public.users (id),
  CONSTRAINT care_service_caregiver_id_fkey FOREIGN KEY (caregiver_id) REFERENCES public.caregivers (id) ON DELETE CASCADE,
  CONSTRAINT care_service_healthcare_provider_id_fkey FOREIGN KEY (healthcare_provider_id) REFERENCES public.healthcare_providers (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  name text NOT NULL,
  report_type text NOT NULL,
  year integer NOT NULL,
  month smallint NOT NULL DEFAULT '-1'::smallint,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  generated_by uuid NULL,
  total integer NOT NULL DEFAULT 0,
  approved integer NOT NULL DEFAULT 0,
  rejected integer NOT NULL DEFAULT 0,
  pending integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_type_check CHECK (report_type = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  CONSTRAINT reports_month_check CHECK (month >= -1 AND month <= 11),
  CONSTRAINT reports_period_unique UNIQUE (report_type, year, month),
  CONSTRAINT reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports USING btree (report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON public.reports USING btree (generated_at);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports USING btree (created_at);
CREATE INDEX IF NOT EXISTS idx_reports_year_month ON public.reports USING btree (year, month);

-- =============================================================
-- VIEWS
-- =============================================================

CREATE VIEW public.admin_health_report_view AS
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

-- =============================================================
-- TRIGGERS FOR UPDATED_AT
-- =============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_application_data_updated_at BEFORE UPDATE ON public.application_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_nominees_updated_at BEFORE UPDATE ON public.nominees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_reports_updated_at BEFORE UPDATE ON public.health_reports
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_support_updated_at BEFORE UPDATE ON public.customer_support_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_health_report_shares_updated_at BEFORE UPDATE ON public.health_report_shares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_caregivers_updated_at BEFORE UPDATE ON public.caregivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_healthcare_providers_updated_at BEFORE UPDATE ON public.healthcare_providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_family_members_updated_at BEFORE UPDATE ON public.family_members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON public.reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER tr_user_bank_details_set_updated_at BEFORE UPDATE ON public.user_bank_details
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
--
-- Only the tables below have RLS enabled with policies anywhere in this
-- repo's history - see KNOWN GAPS #3 at the top of this file for the rest.
-- =============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nominees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_support_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_services ENABLE ROW LEVEL SECURITY;

-- Users: Can only see/edit their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);
-- Lets an elder read the name/email of a caregiver/healthcare provider they
-- have an active care_services contract with, or a verified family member -
-- needed for the health report share dropdowns (src/models/HealthReport.js).
CREATE POLICY "Users can view linked care contacts" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.care_services cs
      WHERE cs.elder_id = auth.uid()
        AND (cs.caregiver_id = users.id OR cs.healthcare_provider_id = users.id)
        AND (cs.end_date IS NULL OR cs.end_date >= CURRENT_DATE)
    )
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = auth.uid()
        AND fm.family_member_user_id = users.id
        AND fm.is_verified = true
    )
  );

-- Applications: Users can see/manage their own applications
CREATE POLICY "Users can view own applications" ON public.applications
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() = joint_user_id);
CREATE POLICY "Users can create own applications" ON public.applications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own applications" ON public.applications
  FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = joint_user_id);

-- Application Data: Users can access their application data
CREATE POLICY "Users can view own application data" ON public.application_data
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = application_data.application_id
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );
CREATE POLICY "Users can create own application data" ON public.application_data
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = application_data.application_id
      AND applications.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update own application data" ON public.application_data
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = application_data.application_id
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );

-- Nominees: Users can view/create/update/delete nominees for their applications
CREATE POLICY "Users can view nominees for own applications" ON public.nominees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = nominees.application_id
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );
CREATE POLICY "Users can create nominees for own applications" ON public.nominees
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = nominees.application_id
      AND applications.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update nominees for own applications" ON public.nominees
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = nominees.application_id
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );
CREATE POLICY "Users can delete nominees for own applications" ON public.nominees
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = nominees.application_id
      AND applications.user_id = auth.uid()
    )
  );

-- Properties: Users can view/create/update properties for their applications
CREATE POLICY "Users can view properties for own applications" ON public.properties
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = properties.application_id
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );
CREATE POLICY "Users can create properties for own applications" ON public.properties
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = properties.application_id
      AND applications.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can update properties for own applications" ON public.properties
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.applications
      WHERE applications.id = properties.application_id
      AND (applications.user_id = auth.uid() OR applications.joint_user_id = auth.uid())
    )
  );

-- Admins need to write indicative_market_value/valuation_date once a
-- scheduled valuation is completed (see migrations/022_*.sql). No existing
-- admin bypass is confirmed for this table (unlike public.applications, see
-- the KNOWN GAPS note at the top of this file), so this is explicit.
CREATE POLICY "Admins can update properties" ON public.properties
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

-- Transactions: Users can view/create their own transactions
CREATE POLICY "Users can view own transactions" ON public.transactions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own transactions" ON public.transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Health Reports: Users can view/create/update their own health reports
CREATE POLICY "Users can view own health reports" ON public.health_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own health reports" ON public.health_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own health reports" ON public.health_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Health Report Shares: Owners manage their own share records; anyone with an
-- active, non-revoked, non-expired link can read that share's metadata.
CREATE POLICY "Share owners can read their shares" ON public.health_report_shares
  FOR SELECT USING (auth.uid() = shared_by_user_id);
CREATE POLICY "Share owners can create shares" ON public.health_report_shares
  FOR INSERT WITH CHECK (auth.uid() = shared_by_user_id);
CREATE POLICY "Share owners can update shares" ON public.health_report_shares
  FOR UPDATE USING (auth.uid() = shared_by_user_id);
CREATE POLICY "Share owners can delete shares" ON public.health_report_shares
  FOR DELETE USING (auth.uid() = shared_by_user_id);
CREATE POLICY "View active link shares" ON public.health_report_shares
  FOR SELECT USING (
    shared_with_type = 'link'
    AND is_revoked = false
    AND (expires_at IS NULL OR expires_at > now())
  );

-- Care coordination: caregivers/healthcare providers manage their own
-- profile; an elder can view the professionals they have a care_services
-- contract with (and manage that contract); admins can manage all of it.
CREATE POLICY "Caregivers can view own profile" ON public.caregivers
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Caregivers can update own profile" ON public.caregivers
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Elders can view contracted caregivers" ON public.caregivers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.care_services cs
      WHERE cs.caregiver_id = caregivers.id AND cs.elder_id = auth.uid()
    )
  );
CREATE POLICY "Admins can manage caregivers" ON public.caregivers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

CREATE POLICY "Healthcare providers can view own profile" ON public.healthcare_providers
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Healthcare providers can update own profile" ON public.healthcare_providers
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Elders can view contracted healthcare providers" ON public.healthcare_providers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.care_services cs
      WHERE cs.healthcare_provider_id = healthcare_providers.id AND cs.elder_id = auth.uid()
    )
  );
CREATE POLICY "Admins can manage healthcare providers" ON public.healthcare_providers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

CREATE POLICY "Elders can manage own family members" ON public.family_members
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Family members can view own relationship" ON public.family_members
  FOR SELECT USING (auth.uid() = family_member_user_id);
CREATE POLICY "Admins can manage family members" ON public.family_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

CREATE POLICY "Elders can manage own care services" ON public.care_services
  FOR ALL USING (auth.uid() = elder_id) WITH CHECK (auth.uid() = elder_id);
CREATE POLICY "Caregivers can view own care services" ON public.care_services
  FOR SELECT USING (auth.uid() = caregiver_id);
CREATE POLICY "Healthcare providers can view own care services" ON public.care_services
  FOR SELECT USING (auth.uid() = healthcare_provider_id);
CREATE POLICY "Admins can manage care services" ON public.care_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

-- Customer Support Inquiries: Users manage their own inquiries; any
-- authenticated user (i.e. staff) can update inquiry status.
CREATE POLICY "Users can view own inquiries" ON public.customer_support_inquiries
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own inquiries" ON public.customer_support_inquiries
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own inquiries" ON public.customer_support_inquiries
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY support_update_inquiries ON public.customer_support_inquiries
  FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Support Conversations: Any authenticated user (staff or elder) can read/insert
CREATE POLICY support_conversations_select_policy ON public.support_conversations
  FOR SELECT
  USING (auth.role() = 'authenticated');
CREATE POLICY support_conversations_insert_policy ON public.support_conversations
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- =============================================================
-- FUNCTIONS
-- =============================================================

-- Secure RPC function to check for duplicate NRICs across users.
-- Runs with SECURITY DEFINER privileges to bypass RLS.
CREATE OR REPLACE FUNCTION check_duplicate_ic(nric_to_check text, exclude_user_id uuid DEFAULT null)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exists_flag boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM users
    WHERE
      (ic_number = nric_to_check OR replace(ic_number, '-', '') = replace(nric_to_check, '-', ''))
      AND (exclude_user_id IS NULL OR id != exclude_user_id)
  ) INTO exists_flag;

  RETURN exists_flag;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_duplicate_ic(text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION check_duplicate_ic(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_duplicate_ic(text, uuid) TO service_role;
-- Registration happens before the user has a session, so the anon role also
-- needs to be able to call this for registration's duplicate-IC check.
GRANT EXECUTE ON FUNCTION check_duplicate_ic(text, uuid) TO anon;

COMMENT ON FUNCTION check_duplicate_ic IS 'Checks if an NRIC is already in use by another user, bypassing RLS.';

-- Secure RPC function to check if an NRIC is already used as a nominee in
-- ANOTHER application.
CREATE OR REPLACE FUNCTION check_duplicate_nominee_ic(nric_to_check text, exclude_application_id uuid DEFAULT null)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exists_flag boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM nominees
    WHERE
      (ic_number = nric_to_check OR replace(ic_number, '-', '') = replace(nric_to_check, '-', ''))
      AND (exclude_application_id IS NULL OR application_id != exclude_application_id)
  ) INTO exists_flag;

  RETURN exists_flag;
END;
$$;

REVOKE EXECUTE ON FUNCTION check_duplicate_nominee_ic(text, uuid) FROM public;
GRANT EXECUTE ON FUNCTION check_duplicate_nominee_ic(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_duplicate_nominee_ic(text, uuid) TO service_role;

-- Normalizes an email for duplicate-detection purposes.
--
-- Plus-addressing (adam+x@domain delivers to adam@domain) is a near-universal
-- mail-server convention -- Gmail, Outlook/Office365, Yahoo, ProtonMail,
-- FastMail, and most Postfix/Sendmail setups (including Google-Workspace-hosted
-- custom domains, e.g. a university's student email) all honor it -- so it is
-- stripped for every domain, not just gmail.com.
--
-- Dot-insensitivity (ad.am@gmail.com == adam@gmail.com) is a Gmail/Google
-- Workspace-specific quirk -- most other providers treat dots in the local
-- part as significant -- so it is only collapsed for gmail.com/googlemail.com
-- literally, to avoid false-positive collisions on domains where dots matter.
CREATE OR REPLACE FUNCTION public.normalize_email(raw_email text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  local_part text;
  domain_part text;
  at_pos int;
BEGIN
  IF raw_email IS NULL THEN
    RETURN NULL;
  END IF;

  raw_email := lower(trim(raw_email));
  at_pos := position('@' in raw_email);
  IF at_pos = 0 THEN
    RETURN raw_email;
  END IF;

  local_part := substring(raw_email from 1 for at_pos - 1);
  domain_part := substring(raw_email from at_pos + 1);

  local_part := split_part(local_part, '+', 1);

  IF domain_part IN ('gmail.com', 'googlemail.com') THEN
    local_part := replace(local_part, '.', '');
    domain_part := 'gmail.com';
  END IF;

  RETURN local_part || '@' || domain_part;
END;
$$;

-- Secure RPC function to check for duplicate emails (including Gmail
-- dot/plus-alias collisions) across all account tables. Runs with SECURITY
-- DEFINER privileges to bypass RLS.
CREATE OR REPLACE FUNCTION check_duplicate_email(email_to_check text, exclude_user_id uuid DEFAULT null)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  exists_flag boolean;
  normalized text;
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

REVOKE EXECUTE ON FUNCTION check_duplicate_email(text, uuid) FROM public;
-- Registration happens before the user has a session, so the anon role
-- needs to be able to call this.
GRANT EXECUTE ON FUNCTION check_duplicate_email(text, uuid) TO anon;
GRANT EXECUTE ON FUNCTION check_duplicate_email(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION check_duplicate_email(text, uuid) TO service_role;

COMMENT ON FUNCTION check_duplicate_email IS 'Checks if an email (normalized for Gmail dot/plus-alias tricks) is already in use across users/admins/customer_supports, bypassing RLS.';

-- BEFORE INSERT/UPDATE trigger (see migrations/028_*.sql) that re-runs
-- check_duplicate_email() against the incoming row and aborts the write on
-- a normalized-email collision. check_duplicate_email() itself is only
-- reachable as a client-invoked RPC, so without this trigger nothing stops
-- a write that skips that call (a direct auth.signUp() call, a race between
-- two concurrent signups, or a future admin/provider/customer_support
-- creation path) from creating a normalized-email duplicate that the raw
-- UNIQUE(email) constraints don't catch.
CREATE OR REPLACE FUNCTION public.enforce_unique_normalized_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.email IS NOT DISTINCT FROM OLD.email THEN
    RETURN NEW;
  END IF;

  IF public.check_duplicate_email(NEW.email, NEW.id) THEN
    RAISE EXCEPTION 'Email % is already registered (possibly under a different alias)', NEW.email
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_unique_normalized_email IS 'BEFORE INSERT/UPDATE trigger that rejects writes whose email normalizes (see normalize_email()) to one already in use across users/admins/customer_supports/providers.';

CREATE TRIGGER enforce_unique_email_users
  BEFORE INSERT OR UPDATE OF email ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_unique_normalized_email();

CREATE TRIGGER enforce_unique_email_admins
  BEFORE INSERT OR UPDATE OF email ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.enforce_unique_normalized_email();

CREATE TRIGGER enforce_unique_email_customer_supports
  BEFORE INSERT OR UPDATE OF email ON public.customer_supports
  FOR EACH ROW EXECUTE FUNCTION public.enforce_unique_normalized_email();

CREATE TRIGGER enforce_unique_email_providers
  BEFORE INSERT OR UPDATE OF email ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_unique_normalized_email();

-- Auto-creates the public.users profile row when a new auth.users row is
-- inserted. Requires an `on_auth_user_created` trigger on auth.users - see
-- KNOWN GAPS #2 at the top of this file, that trigger must be created
-- manually since it was originally wired up directly in the dashboard.
--
-- full_name / ic_number / phone come from raw_user_meta_data, which
-- authService.js signUp() populates via
-- supabase.auth.signUp({ options: { data: {...} } }).
--
-- Staff accounts (admins / customer_supports) are created without ic_number
-- metadata, so this function skips them rather than failing the auth.users
-- insert on the users.ic_number NOT NULL constraint.
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.raw_user_meta_data ->> 'ic_number' IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.users (id, email, full_name, ic_number, phone)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'ic_number',
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (id, ic_number) DO NOTHING;

  RETURN NEW;
END;
$$;

-- =============================================================
-- REMINDER / HEALTH-REPORT AUTOMATION (see migrations/018_*.sql)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.health_report_type_validity (
  report_type text PRIMARY KEY,
  valid_months integer NOT NULL DEFAULT 3
);

-- archive_old_health_reports(), update_health_reports_due_status(),
-- generate_reminder_notifications(), invoke_update_health_reports_runner()
-- and invoke_reminder_processor() are defined in
-- migrations/018_reminder_and_health_report_automation.sql (kept there rather
-- than duplicated here since that file also carries the pg_cron schedule
-- calls and vault-secret setup notes needed to actually run them).

-- =============================================================
-- LOAN DISBURSEMENT AUTOMATION (see migrations/021_*.sql)
-- =============================================================

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

ALTER TABLE public.loan_disbursement_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all disbursement schedules" ON public.loan_disbursement_schedules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

CREATE POLICY "Admins can update disbursement schedules" ON public.loan_disbursement_schedules
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

-- generate_due_loan_disbursements() and invoke_loan_disbursement_notifier() are
-- defined in migrations/021_loan_disbursement_automation.sql (kept there rather
-- than duplicated here since that file also carries the pg_cron schedule calls
-- and vault-secret setup notes needed to actually run them). Migration 023
-- updates generate_due_loan_disbursements() in place to prefer an accepted
-- offer's loan_term_months over the hardcoded 240 - see that file.

-- =============================================================
-- PROVIDER AUCTION SYSTEM (see migrations/023_*.sql)
-- =============================================================

-- One row per (application, provider), upserted in place as a provider
-- submits/withdraws/resubmits - no bid-history ledger, only the current
-- offer per provider matters for this auction model.
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

-- Deferred from the applications table above since loan_offers references
-- applications and didn't exist yet.
ALTER TABLE public.applications
  ADD CONSTRAINT applications_accepted_offer_id_fkey FOREIGN KEY (accepted_offer_id) REFERENCES public.loan_offers (id) ON DELETE SET NULL;

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

-- Atomic accept + reject-the-rest + status flip. SECURITY DEFINER RPC (not
-- 2-3 separate client PATCH calls) because acceptance must rewrite
-- applications AND flip the winning offer AND reject every other submitted
-- offer, atomically. FOR UPDATE row locks plus the status guards make this
-- race-safe against double-clicks/tabs, mirroring the claim-then-act pattern
-- LoanDisbursement.confirmScheduledDisbursement already uses at the JS
-- layer, done properly at the DB layer since this needs atomicity across
-- two tables.
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

-- =============================================================
-- AUDIT LOG (see migrations/025_*.sql, migrations/026_*.sql)
-- =============================================================

-- Append-only change history. applications/loan_offers otherwise have no way
-- to answer "what changed, by whom, when" - remarks/status/approved_amount/
-- etc. are overwritten in place on UPDATE, the *_at columns (submitted_at,
-- approved_at, rejected_at, ...) only ever hold the latest occurrence (not a
-- sequence of transitions), and loan_offers is explicitly "no bid-history
-- ledger, only the current offer per provider matters" (see the comment
-- above CREATE TABLE public.loan_offers). audit_trigger_fn() below records
-- just the columns that changed on UPDATE (full row on INSERT/DELETE) and is
-- generic - attach it to another table with one more CREATE TRIGGER.
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid NULL, -- auth.uid() at write time; NULL when written by service role / edge function
  actor_name text NULL, -- resolved once at write time - see audit_trigger_fn()
  actor_role text NULL, -- 'user' | 'admin' | 'support' | 'provider'
  old_values jsonb NULL,
  new_values jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_entity ON public.audit_log USING btree (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_log_actor ON public.audit_log USING btree (actor_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );
-- No INSERT/UPDATE/DELETE policy for any role: rows are only ever written by
-- audit_trigger_fn(), which is SECURITY DEFINER and so bypasses RLS. Nobody,
-- including admins, can edit or delete an audit row through the API.

-- actor_id alone isn't useful to render in an admin UI without a second
-- round-trip per row, and that round-trip would need to query
-- users/admins/customer_supports/providers - tables the admin viewing the
-- log may not have RLS visibility into for arbitrary rows (public.users only
-- allows a user to see their own row). Resolving the name here sidesteps
-- that: SECURITY DEFINER runs with elevated privileges and only has to do
-- the lookup once, at write time.
CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_changed_old jsonb;
  v_changed_new jsonb;
  v_actor_id uuid;
  v_actor_name text;
  v_actor_role text;
BEGIN
  v_actor_id := auth.uid();

  IF v_actor_id IS NOT NULL THEN
    SELECT full_name INTO v_actor_name FROM public.users WHERE id = v_actor_id;
    IF v_actor_name IS NOT NULL THEN
      v_actor_role := 'user';
    ELSE
      SELECT full_name INTO v_actor_name FROM public.admins WHERE id = v_actor_id;
      IF v_actor_name IS NOT NULL THEN
        v_actor_role := 'admin';
      ELSE
        SELECT full_name INTO v_actor_name FROM public.customer_supports WHERE id = v_actor_id;
        IF v_actor_name IS NOT NULL THEN
          v_actor_role := 'support';
        ELSE
          SELECT COALESCE(contact_person, company_name) INTO v_actor_name FROM public.providers WHERE id = v_actor_id;
          IF v_actor_name IS NOT NULL THEN
            v_actor_role := 'provider';
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);

    SELECT jsonb_object_agg(key, v_old -> key), jsonb_object_agg(key, v_new -> key)
      INTO v_changed_old, v_changed_new
    FROM jsonb_object_keys(v_new) AS key
    WHERE v_old -> key IS DISTINCT FROM v_new -> key;

    IF v_changed_new IS NULL THEN
      RETURN NEW; -- every column has the same value as before (no-op UPDATE)
    END IF;

    INSERT INTO public.audit_log (entity_type, entity_id, action, actor_id, actor_name, actor_role, old_values, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, v_actor_id, v_actor_name, v_actor_role, v_changed_old, v_changed_new);
    RETURN NEW;

  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, actor_id, actor_name, actor_role, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, v_actor_id, v_actor_name, v_actor_role, to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, actor_id, actor_name, actor_role, old_values)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, v_actor_id, v_actor_name, v_actor_role, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER audit_applications
  AFTER INSERT OR UPDATE OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_loan_offers
  AFTER INSERT OR UPDATE OR DELETE ON public.loan_offers
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
