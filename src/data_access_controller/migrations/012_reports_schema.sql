-- Reports table for admin analytics and history
create table if not exists public.reports (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  report_type text not null,
  year integer not null,
  month smallint not null default '-1'::smallint,
  generated_at timestamp with time zone not null default now(),
  generated_by uuid null,
  total integer not null default 0,
  approved integer not null default 0,
  rejected integer not null default 0,
  pending integer not null default 0,
  constraint reports_pkey primary key (id),
  constraint reports_type_check check (
    report_type = any (array['monthly'::text, 'yearly'::text])
  ),
  constraint reports_month_check check (
    month >= -1 and month <= 11
  ),
  constraint reports_period_unique unique (report_type, year, month),
  constraint reports_generated_by_fkey foreign key (generated_by) references users (id) on delete set null
) TABLESPACE pg_default;

create index if not exists idx_reports_type on public.reports using btree (report_type) TABLESPACE pg_default;
create index if not exists idx_reports_generated_at on public.reports using btree (generated_at) TABLESPACE pg_default;
create index if not exists idx_reports_year_month on public.reports using btree (year, month) TABLESPACE pg_default;
