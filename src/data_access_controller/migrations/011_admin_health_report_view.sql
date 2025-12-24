create view public.admin_health_report_view as
select
  hr.id as health_report_id,
  hr.user_id,
  u.email as user_email,
  u.full_name as user_full_name,
  u.ic_number,
  u.phone,
  hr.report_date,
  hr.report_type,
  hr.report_title,
  hr.provider_name,
  hr.health_report_status,
  hr.created_at as report_created_at
from
  health_reports hr
  left join users u on u.id = hr.user_id;