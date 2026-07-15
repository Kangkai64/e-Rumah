-- Migration 024: Let applicants cancel their own application before approval.
--
-- Termination (Application.terminate / Admin.updateApplicationStatus) only
-- ever fires post-approval and requires admin sign-off, because an approved/
-- auctioning application may already involve disbursement or nominee-payout
-- unwinding. A 'submitted' or plain 'underReviewed' application has none of
-- that, so cancellation here is self-service and immediate - no admin review
-- step. A distinct 'cancelled' status (rather than reusing 'terminated') keeps
-- "withdrawn before approval, nothing to unwind" separate from "was approved,
-- then ended, possibly still owed money" in dashboards/reports.
--
-- 'cancelled' is deliberately left out of idx_one_active_application, same as
-- 'rejected' and 'draft' already are, so a cancelled application never blocks
-- the user from starting a new one.

ALTER TABLE public.applications
  ADD COLUMN cancellation_reason text NULL,
  ADD COLUMN cancelled_at timestamp with time zone NULL;

ALTER TABLE public.applications DROP CONSTRAINT applications_status_check;
ALTER TABLE public.applications ADD CONSTRAINT applications_status_check CHECK (
  status = ANY (ARRAY['draft'::text, 'submitted'::text, 'underReviewed'::text, 'approved'::text, 'auctioning'::text, 'rejected'::text, 'terminated'::text, 'cancelled'::text])
);
