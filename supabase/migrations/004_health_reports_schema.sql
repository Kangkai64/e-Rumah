create table public.health_reports (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  application_id uuid null,
  report_date date not null,
  report_type text null,
  report_file_url text null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  health_report_status text not null default 'Pending'::text,
  due_status text null,
  report_title text null,
  provider_name text null,
  constraint health_reports_pkey primary key (id),
  constraint health_reports_application_id_fkey foreign KEY (application_id) references applications (id) on delete set null,
  constraint health_reports_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint health_reports_due_status_check check (
    (
      due_status = any (
        array[
          'Overdue'::text,
          'Due Soon'::text,
          'Up to Date'::text
        ]
      )
    )
  ),
  constraint health_reports_health_report_status_check check (
    (
      health_report_status = any (
        array[
          'Pending'::text,
          'Reviewed'::text,
          'Flagged'::text,
          'Archived'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_health_reports_due_status on public.health_reports using btree (due_status) TABLESPACE pg_default;

create index IF not exists idx_health_reports_health_report_status on public.health_reports using btree (health_report_status) TABLESPACE pg_default;

create index IF not exists idx_health_reports_statuses on public.health_reports using btree (health_report_status, due_status) TABLESPACE pg_default;

create index IF not exists idx_health_reports_report_title on public.health_reports using gin (to_tsvector('english'::regconfig, report_title)) TABLESPACE pg_default;

create index IF not exists idx_health_reports_user_id on public.health_reports using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_health_reports_application_id on public.health_reports using btree (application_id) TABLESPACE pg_default;

create index IF not exists idx_health_reports_provider_name on public.health_reports using gin (to_tsvector('english'::regconfig, provider_name)) TABLESPACE pg_default;

create trigger update_health_reports_updated_at BEFORE
update on health_reports for EACH row
execute FUNCTION update_updated_at_column ();

create table public.health_report_shares (
  id uuid not null default extensions.uuid_generate_v4 (),
  report_id uuid not null,
  shared_with_type text not null,
  shared_with_id uuid null,
  shared_with_email text null,
  share_token text null,
  expires_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  accessed_at timestamp with time zone null,
  access_count integer null default 0,
  constraint health_report_shares_pkey primary key (id),
  constraint health_report_shares_share_token_key unique (share_token),
  constraint health_report_shares_report_id_fkey foreign KEY (report_id) references health_reports (id) on delete CASCADE,
  constraint health_report_shares_shared_with_id_fkey foreign KEY (shared_with_id) references users (id) on delete CASCADE,
  constraint health_report_shares_shared_with_type_check check (
    (
      shared_with_type = any (
        array[
          'caregiver'::text,
          'family'::text,
          'healthcare_provider'::text,
          'public_link'::text,
          'email'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_health_report_shares_report_id on public.health_report_shares using btree (report_id) TABLESPACE pg_default;

create index IF not exists idx_health_report_shares_share_token on public.health_report_shares using btree (share_token) TABLESPACE pg_default;

create index IF not exists idx_health_report_shares_shared_with_id on public.health_report_shares using btree (shared_with_id) TABLESPACE pg_default;

create trigger update_health_report_shares_updated_at BEFORE
update on health_report_shares for EACH row
execute FUNCTION update_updated_at_column ();