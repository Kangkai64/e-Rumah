create table public.users (
  id uuid not null,
  email text not null,
  full_name text null,
  ic_number text not null,
  phone text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint users_pkey primary key (id, ic_number),
  constraint users_email_key unique (email),
  constraint users_id_unique unique (id),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create trigger update_users_updated_at BEFORE
update on users for EACH row
execute FUNCTION update_updated_at_column ();

// new tables

create table public.admins (
  id uuid not null,
  email text null,
  type text null,
  full_name text null,
  phone text null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  constraint admin_pkey primary key (id),
  constraint admin_email_key unique (email),
  constraint admin_id_fkey foreign KEY (id) references auth.users (id) on update CASCADE on delete RESTRICT
) TABLESPACE pg_default;

create table public.customer_supports (
  id uuid not null,
  email text null,
  full_name text null,
  phone text null,
  created_at timestamp with time zone null,
  updated_at timestamp with time zone null,
  role text null,
  constraint customer_support_pkey primary key (id),
  constraint customer_support_email_key unique (email)
) TABLESPACE pg_default;

create table public.caregivers (
  id uuid not null,
  license_number text null,
  specialization text null,
  years_of_experience integer null,
  bio text null,
  is_verified boolean not null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint caregivers_pkey primary key (id),
  constraint caregivers_id_fkey foreign KEY (id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_caregivers_user_id on public.caregivers using btree (id) TABLESPACE pg_default;

create index IF not exists idx_caregivers_is_verified on public.caregivers using btree (is_verified) TABLESPACE pg_default;

create trigger update_caregivers_updated_at BEFORE
update on caregivers for EACH row
execute FUNCTION update_updated_at_column ();

create table public.healthcare_providers (
  id uuid not null,
  provider_type text not null default 'doctor'::text,
  license_number text null,
  specialty text null,
  organization_name text null,
  address text null,
  is_verified boolean not null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint healthcare_providers_pkey primary key (id),
  constraint healthcare_providers_id_fkey foreign KEY (id) references users (id) on delete CASCADE,
  constraint healthcare_providers_type_check check (
    (
      provider_type = any (
        array[
          'doctor'::text,
          'nurse'::text,
          'clinic'::text,
          'hospital'::text,
          'therapist'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_healthcare_providers_user_id on public.healthcare_providers using btree (id) TABLESPACE pg_default;

create index IF not exists idx_healthcare_providers_type on public.healthcare_providers using btree (provider_type) TABLESPACE pg_default;

create index IF not exists idx_healthcare_providers_is_verified on public.healthcare_providers using btree (is_verified) TABLESPACE pg_default;

create trigger update_healthcare_providers_updated_at BEFORE
update on healthcare_providers for EACH row
execute FUNCTION update_updated_at_column ();

create table public.family_members (
  id uuid not null,
  family_member_user_id uuid not null,
  relationship_type text not null,
  is_emergency_contact boolean not null default false,
  is_verified boolean not null default false,
  permissions_level text not null default 'view'::text,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint family_members_unique_relationship unique (id, family_member_user_id),
  constraint family_members_family_user_id_fkey foreign KEY (family_member_user_id) references users (id) on delete CASCADE,
  constraint family_members_id_fkey foreign KEY (id) references users (id) on delete CASCADE,
  constraint family_members_not_self check ((id <> family_member_user_id)),
  constraint family_members_permissions_check check (
    (
      permissions_level = any (
        array[
          'view'::text,
          'view_and_share'::text,
          'full'::text
        ]
      )
    )
  ),
  constraint family_members_relationship_check check (
    (
      relationship_type = any (
        array[
          'spouse'::text,
          'partner'::text,
          'parent'::text,
          'child'::text,
          'sibling'::text,
          'grandparent'::text,
          'grandchild'::text,
          'other'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_family_members_user_id on public.family_members using btree (id) TABLESPACE pg_default;

create index IF not exists idx_family_members_family_user_id on public.family_members using btree (family_member_user_id) TABLESPACE pg_default;

create index IF not exists idx_family_members_relationship on public.family_members using btree (relationship_type) TABLESPACE pg_default;

create index IF not exists idx_family_members_emergency on public.family_members using btree (is_emergency_contact) TABLESPACE pg_default;

create index IF not exists idx_family_members_verified on public.family_members using btree (is_verified) TABLESPACE pg_default;

create trigger update_family_members_updated_at BEFORE
update on family_members for EACH row
execute FUNCTION update_updated_at_column ();

create table public.care_services (
  service_id uuid not null default gen_random_uuid (),
  caregiver_id uuid not null,
  healthcare_provider_id uuid not null,
  elder_id uuid not null,
  description text null,
  start_date date not null,
  end_date date null,
  cost numeric null,
  attachment_link text null,
  constraint care_service_pkey primary key (service_id),
  constraint care_service_elder_id_fkey foreign KEY (elder_id) references users (id)
) TABLESPACE pg_default;

create table public.applications (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  joint_user_id uuid null,
  status text not null default 'draft'::text,
  remarks text null,
  main_applicant_deceased boolean null default false,
  submitted_at timestamp with time zone null,
  reviewed_at timestamp with time zone null,
  approved_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_flagged boolean null default false,
  flagged_reason text null,
  flagged_at timestamp with time zone null,
  flagged_by uuid null,
  flagged_code public.flagged_code null,
  termination_reason text null,
  termination_submitted_at timestamp with time zone null,
  termination_update_at timestamp with time zone null,
  approved_amount numeric null,
  reject_termination_reason text null,
  constraint applications_pkey primary key (id),
  constraint applications_flagged_by_fkey foreign KEY (flagged_by) references admins (id) on update CASCADE on delete RESTRICT,
  constraint applications_joint_user_id_fkey foreign KEY (joint_user_id) references users (id) on delete set null,
  constraint applications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint applications_approved_amount_check check ((approved_amount > (0)::numeric)),
  constraint applications_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'submitted'::text,
          'underReviewed'::text,
          'approved'::text,
          'rejected'::text,
          'terminated'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_applications_flagged on public.applications using btree (is_flagged) TABLESPACE pg_default
where
  (is_flagged = true);

create index IF not exists idx_applications_user_id on public.applications using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_applications_status on public.applications using btree (status) TABLESPACE pg_default;

create unique INDEX IF not exists idx_one_active_application on public.applications using btree (user_id) TABLESPACE pg_default
where
  (
    status = any (array['approved'::text, 'underReviewed'::text])
  );

create trigger update_applications_updated_at BEFORE
update on applications for EACH row
execute FUNCTION update_updated_at_column ();

create table public.user_bank_details (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  account_holder_name text not null,
  bank_name text not null,
  bank_account_number text not null,
  account_type text null,
  is_primary boolean not null default true,
  is_verified boolean not null default false,
  verified_at timestamp with time zone null,
  notes text null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint user_bank_details_pkey primary key (id),
  constraint user_bank_details_user_account_unique unique (user_id, bank_account_number),
  constraint user_bank_details_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_bank_details_user_id on public.user_bank_details using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_bank_details_is_primary on public.user_bank_details using btree (is_primary) TABLESPACE pg_default;

create trigger tr_user_bank_details_set_updated_at BEFORE
update on user_bank_details for EACH row
execute FUNCTION update_updated_at_column ();