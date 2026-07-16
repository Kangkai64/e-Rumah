-- Migration 034: Extend the audit log (see migrations/025_*.sql,
-- migrations/026_*.sql) to health_reports.
--
-- health_report_status (Pending/Reviewed/Flagged/Archived), due_status, and
-- flagged_reason are all overwritten in place on UPDATE - there is currently
-- no way to answer "who flagged this report, when, and what was the reason
-- before it was cleared". audit_trigger_fn() is already generic, so this is
-- just one more CREATE TRIGGER.

CREATE TRIGGER audit_health_reports
  AFTER INSERT OR UPDATE OR DELETE ON public.health_reports
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
