create table public.health_report_shares (
  id uuid not null default gen_random_uuid (),
  report_id uuid not null,
  shared_by_user_id uuid not null,
  shared_with_type text not null,
  shared_with_id uuid null,
  shared_with_email text null,
  expires_at timestamp with time zone null,
  is_revoked boolean not null default false,
  access_count integer not null default 0,
  last_accessed_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  share_token text not null,
  constraint health_report_shares_pkey primary key (id),
  constraint health_report_shares_share_token_key unique (share_token),
  constraint health_report_shares_report_id_fkey foreign KEY (report_id) references health_reports (id) on delete CASCADE,
  constraint health_report_shares_shared_by_fkey foreign KEY (shared_by_user_id) references users (id) on delete CASCADE,
  constraint health_report_shares_type_check check (
    (
      shared_with_type = any (
        array[
          'caregiver'::text,
          'family'::text,
          'healthcare_provider'::text,
          'link'::text,
          'email'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_health_report_shares_report_id on public.health_report_shares using btree (report_id) TABLESPACE pg_default;

create index IF not exists idx_health_report_shares_shared_by on public.health_report_shares using btree (shared_by_user_id) TABLESPACE pg_default;

create index IF not exists idx_health_report_shares_shared_with on public.health_report_shares using btree (shared_with_id) TABLESPACE pg_default;

create index IF not exists idx_health_report_shares_email on public.health_report_shares using btree (shared_with_email) TABLESPACE pg_default;

create index IF not exists idx_health_report_shares_expires_at on public.health_report_shares using btree (expires_at) TABLESPACE pg_default;

create index IF not exists idx_health_report_shares_type on public.health_report_shares using btree (shared_with_type) TABLESPACE pg_default;

create index IF not exists idx_health_report_shares_composite on public.health_report_shares using btree (report_id, shared_with_type, shared_with_id) TABLESPACE pg_default;

create unique INDEX IF not exists uniq_health_report_shares_share_token on public.health_report_shares using btree (share_token) TABLESPACE pg_default
where
  (share_token is not null);

create trigger update_health_report_shares_updated_at BEFORE
update on health_report_shares for EACH row
execute FUNCTION update_updated_at_column ();

create table public.caregivers (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  license_number text null,
  specialization text null,
  years_of_experience integer null,
  bio text null,
  is_verified boolean not null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint caregivers_pkey primary key (id),
  constraint caregivers_user_id_key unique (user_id),
  constraint caregivers_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_caregivers_user_id on public.caregivers using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_caregivers_is_verified on public.caregivers using btree (is_verified) TABLESPACE pg_default;

create trigger update_caregivers_updated_at BEFORE
update on caregivers for EACH row
execute FUNCTION update_updated_at_column ();

create table public.healthcare_providers (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  provider_type text not null default 'doctor'::text,
  license_number text null,
  specialty text null,
  organization_name text null,
  address text null,
  is_verified boolean not null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint healthcare_providers_pkey primary key (id),
  constraint healthcare_providers_user_id_key unique (user_id),
  constraint healthcare_providers_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
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

create index IF not exists idx_healthcare_providers_user_id on public.healthcare_providers using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_healthcare_providers_type on public.healthcare_providers using btree (provider_type) TABLESPACE pg_default;

create index IF not exists idx_healthcare_providers_is_verified on public.healthcare_providers using btree (is_verified) TABLESPACE pg_default;

create trigger update_healthcare_providers_updated_at BEFORE
update on healthcare_providers for EACH row
execute FUNCTION update_updated_at_column ();

create table public.family_members (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  family_member_user_id uuid not null,
  relationship_type text not null,
  is_emergency_contact boolean not null default false,
  is_verified boolean not null default false,
  permissions_level text not null default 'view'::text,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint family_members_pkey primary key (id),
  constraint family_members_unique_relationship unique (user_id, family_member_user_id),
  constraint family_members_family_user_id_fkey foreign KEY (family_member_user_id) references users (id) on delete CASCADE,
  constraint family_members_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint family_members_not_self check ((user_id <> family_member_user_id)),
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

create index IF not exists idx_family_members_user_id on public.family_members using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_family_members_family_user_id on public.family_members using btree (family_member_user_id) TABLESPACE pg_default;

create index IF not exists idx_family_members_relationship on public.family_members using btree (relationship_type) TABLESPACE pg_default;

create index IF not exists idx_family_members_emergency on public.family_members using btree (is_emergency_contact) TABLESPACE pg_default;

create index IF not exists idx_family_members_verified on public.family_members using btree (is_verified) TABLESPACE pg_default;

create trigger update_family_members_updated_at BEFORE
update on family_members for EACH row
execute FUNCTION update_updated_at_column ();