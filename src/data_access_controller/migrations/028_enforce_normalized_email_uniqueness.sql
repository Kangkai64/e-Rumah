-- Migration 028: Enforce normalized-email uniqueness at the database level.
--
-- check_duplicate_email() (see 017_check_duplicate_email.sql / schema.sql)
-- has always been reachable only as a client-invoked RPC -- RegistrationPage.jsx
-- calls it on blur and again right before signUp(), but nothing stops a
-- write that skips that call entirely (a direct supabase.auth.signUp() call,
-- a race between two concurrent signups that both pass the pre-check before
-- either row exists, or any future admin/provider/customer_support creation
-- path). The users/admins/customer_supports/providers UNIQUE(email)
-- constraints only cover the literal raw string, so they don't catch
-- normalized collisions like ad.am@gmail.com vs adam@gmail.com or
-- adam+tag@domain vs adam@domain either.
--
-- This closes the gap with a BEFORE INSERT OR UPDATE OF email trigger, on
-- all four account tables, that re-runs check_duplicate_email() against the
-- incoming row and aborts the write on collision.
CREATE OR REPLACE FUNCTION public.enforce_unique_normalized_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NULL THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND NEW.email IS NOT DISTINCT FROM OLD.email THEN
    RETURN NEW;
  END IF;

  IF public.check_duplicate_email(NEW.email, NEW.id) THEN
    RAISE EXCEPTION 'Email % is already registered (possibly under a different alias)', NEW.email
      USING ERRCODE = 'unique_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_unique_normalized_email IS 'BEFORE INSERT/UPDATE trigger that rejects writes whose email normalizes (see normalize_email()) to one already in use across users/admins/customer_supports/providers.';

CREATE TRIGGER enforce_unique_email_users
  BEFORE INSERT OR UPDATE OF email ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.enforce_unique_normalized_email();

CREATE TRIGGER enforce_unique_email_admins
  BEFORE INSERT OR UPDATE OF email ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.enforce_unique_normalized_email();

CREATE TRIGGER enforce_unique_email_customer_supports
  BEFORE INSERT OR UPDATE OF email ON public.customer_supports
  FOR EACH ROW EXECUTE FUNCTION public.enforce_unique_normalized_email();

CREATE TRIGGER enforce_unique_email_providers
  BEFORE INSERT OR UPDATE OF email ON public.providers
  FOR EACH ROW EXECUTE FUNCTION public.enforce_unique_normalized_email();
