-- Migration 035: Extend the audit log (see migrations/025_*.sql,
-- migrations/026_*.sql, migrations/034_*.sql) to loan_disbursement_schedules
-- and property_valuation_schedules.
--
-- loan_disbursement_schedules.status/confirmed_by/confirmed_at are
-- overwritten in place on UPDATE - this is actual money movement with no
-- other history of who confirmed/skipped/cancelled a payout or when.
--
-- property_valuation_schedules.status/result_value/completed_by/
-- cancelled_reason are likewise overwritten in place, and result_value feeds
-- applications.approved_amount, so a disputed valuation currently has no
-- paper trail either.
--
-- audit_trigger_fn() is already generic, so this is just two more
-- CREATE TRIGGERs.

CREATE TRIGGER audit_loan_disbursement_schedules
  AFTER INSERT OR UPDATE OR DELETE ON public.loan_disbursement_schedules
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();

CREATE TRIGGER audit_property_valuation_schedules
  AFTER INSERT OR UPDATE OR DELETE ON public.property_valuation_schedules
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
