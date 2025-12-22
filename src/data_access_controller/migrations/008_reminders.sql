create table public.reminders (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid not null,
  reminder_type text not null,
  reminder_title text not null,
  reminder_date timestamp with time zone not null,
  is_enabled boolean not null default true,
  reminder_frequencies jsonb null,
  category text null default 'Health & appointments'::text,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  notified_at timestamp with time zone null,
  constraint reminders_pkey primary key (id),
  constraint reminders_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint reminders_category_check check (
    (
      category = any (
        array[
          'Health & appointments'::text,
          'Medication'::text,
          'Personal'::text,
          'Other'::text
        ]
      )
    )
  ),
  constraint reminders_reminder_type_check check (
    (
      reminder_type = any (
        array[
          'Next health check'::text,
          'Medication refill'::text,
          'Blood pressure check'::text,
          'Doctor visit'::text,
          'Vaccination'::text,
          'Lab test'::text,
          'Custom'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_reminders_user_id on public.reminders using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_reminders_reminder_date on public.reminders using btree (reminder_date) TABLESPACE pg_default;

create index IF not exists idx_reminders_is_enabled on public.reminders using btree (is_enabled) TABLESPACE pg_default;

create index IF not exists idx_reminders_user_date on public.reminders using btree (user_id, reminder_date) TABLESPACE pg_default;

create index IF not exists idx_reminders_category on public.reminders using btree (category) TABLESPACE pg_default;

create index IF not exists idx_reminders_type on public.reminders using btree (reminder_type) TABLESPACE pg_default;

create trigger update_reminders_updated_at BEFORE
update on reminders for EACH row
execute FUNCTION update_updated_at_column ();

create table public.reminder_notifications (
  id uuid not null default extensions.uuid_generate_v4 (),
  reminder_id uuid not null,
  scheduled_time timestamp with time zone not null,
  notification_offset interval not null,
  is_sent boolean not null default false,
  sent_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint reminder_notifications_pkey primary key (id),
  constraint reminder_notifications_reminder_id_fkey foreign KEY (reminder_id) references reminders (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_reminder_notifications_reminder_id on public.reminder_notifications using btree (reminder_id) TABLESPACE pg_default;

create index IF not exists idx_reminder_notifications_scheduled_time on public.reminder_notifications using btree (scheduled_time) TABLESPACE pg_default;

create index IF not exists idx_reminder_notifications_is_sent on public.reminder_notifications using btree (is_sent) TABLESPACE pg_default;

create index IF not exists idx_reminder_notifications_pending on public.reminder_notifications using btree (is_sent, scheduled_time) TABLESPACE pg_default
where
  (is_sent = false);