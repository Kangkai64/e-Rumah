-- e-Rumah Database Schema (consolidated)
--
-- This is the full current schema in one file, run in the Supabase SQL
-- Editor against a fresh database. It replaces what used to be 14 numbered
-- migration files plus a folder of raw dashboard dumps; that fragmented
-- history (duplicate migration numbers, an add-then-remove column pair, a
-- users.role column that was added then dropped again directly in the
-- dashboard) has been resolved here in favor of a single source of truth.
-- See git history for the step-by-step evolution if needed.
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
--   3. Several tables added later (admins, customer_supports, caregivers,
--      healthcare_providers, family_members, care_services, user_bank_details,
--      reminders, reminder_notifications, reports) have no RLS policies
--      defined anywhere in this repo's history. Only the tables covered
--      below have RLS enabled with policies.

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
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES public.admins (id) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT applications_joint_user_id_fkey FOREIGN KEY (joint_user_id) REFERENCES public.users (id) ON DELETE SET NULL,
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users (id) ON DELETE CASCADE,
  CONSTRAINT applications_approved_amount_check CHECK ((approved_amount > (0)::numeric)),
  CONSTRAINT applications_status_check CHECK (
    status = ANY (ARRAY['draft'::text, 'submitted'::text, 'underReviewed'::text, 'approved'::text, 'rejected'::text, 'terminated'::text])
  )
);
CREATE INDEX idx_applications_flagged ON public.applications USING btree (is_flagged) WHERE (is_flagged = true);
CREATE INDEX idx_applications_user_id ON public.applications USING btree (user_id);
CREATE INDEX idx_applications_status ON public.applications USING btree (status);
CREATE UNIQUE INDEX idx_one_active_application ON public.applications USING btree (user_id) WHERE (status = ANY (ARRAY['approved'::text, 'underReviewed'::text]));

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
  CONSTRAINT care_service_elder_id_fkey FOREIGN KEY (elder_id) REFERENCES public.users (id)
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
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_type_check CHECK (report_type = ANY (ARRAY['monthly'::text, 'yearly'::text])),
  CONSTRAINT reports_month_check CHECK (month >= -1 AND month <= 11),
  CONSTRAINT reports_period_unique UNIQUE (report_type, year, month),
  CONSTRAINT reports_generated_by_fkey FOREIGN KEY (generated_by) REFERENCES public.users (id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_reports_type ON public.reports USING btree (report_type);
CREATE INDEX IF NOT EXISTS idx_reports_generated_at ON public.reports USING btree (generated_at);
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
  hr.report_date,
  hr.report_type,
  hr.report_title,
  hr.provider_name,
  hr.health_report_status,
  hr.created_at AS report_created_at
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

-- Users: Can only see/edit their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

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

-- Normalizes an email for duplicate-detection purposes, including a Gmail
-- "dot trick" / plus-addressing guard (adam@gmail.com, ad.am@gmail.com and
-- adam+x@gmail.com all deliver to the same inbox, so they should collide).
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

  IF domain_part IN ('gmail.com', 'googlemail.com') THEN
    local_part := split_part(local_part, '+', 1);
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
