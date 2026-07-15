-- Migration 026: Extend the audit log (see migrations/025_*.sql) to
-- loan_offers, and resolve a human-readable actor name/role at write time.
--
-- loan_offers was explicitly "no bid-history ledger, only the current offer
-- per provider matters" (see the comment above CREATE TABLE public.loan_offers)
-- - a provider submitting/withdrawing/resubmitting an offer overwrote the
-- only record of it. Reusing audit_trigger_fn() here gives that history back
-- for free.
--
-- actor_id alone (an auth.uid()) isn't useful to render in an admin UI
-- without a second round-trip per row, and that round-trip would need to
-- query users/admins/customer_supports/providers - tables the admin viewing
-- the log may not have RLS visibility into for arbitrary rows (e.g. public.users
-- only allows a user to see their own row). Resolving the name inside the
-- SECURITY DEFINER trigger sidesteps that: it runs with elevated privileges
-- and only has to do the lookup once, at write time.

ALTER TABLE public.audit_log
  ADD COLUMN actor_name text NULL,
  ADD COLUMN actor_role text NULL;

CREATE OR REPLACE FUNCTION public.audit_trigger_fn()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old jsonb;
  v_new jsonb;
  v_changed_old jsonb;
  v_changed_new jsonb;
  v_actor_id uuid;
  v_actor_name text;
  v_actor_role text;
BEGIN
  v_actor_id := auth.uid();

  IF v_actor_id IS NOT NULL THEN
    SELECT full_name INTO v_actor_name FROM public.users WHERE id = v_actor_id;
    IF v_actor_name IS NOT NULL THEN
      v_actor_role := 'user';
    ELSE
      SELECT full_name INTO v_actor_name FROM public.admins WHERE id = v_actor_id;
      IF v_actor_name IS NOT NULL THEN
        v_actor_role := 'admin';
      ELSE
        SELECT full_name INTO v_actor_name FROM public.customer_supports WHERE id = v_actor_id;
        IF v_actor_name IS NOT NULL THEN
          v_actor_role := 'support';
        ELSE
          SELECT COALESCE(contact_person, company_name) INTO v_actor_name FROM public.providers WHERE id = v_actor_id;
          IF v_actor_name IS NOT NULL THEN
            v_actor_role := 'provider';
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_old := to_jsonb(OLD);
    v_new := to_jsonb(NEW);

    SELECT jsonb_object_agg(key, v_old -> key), jsonb_object_agg(key, v_new -> key)
      INTO v_changed_old, v_changed_new
    FROM jsonb_object_keys(v_new) AS key
    WHERE v_old -> key IS DISTINCT FROM v_new -> key;

    IF v_changed_new IS NULL THEN
      RETURN NEW; -- every column has the same value as before (no-op UPDATE)
    END IF;

    INSERT INTO public.audit_log (entity_type, entity_id, action, actor_id, actor_name, actor_role, old_values, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, v_actor_id, v_actor_name, v_actor_role, v_changed_old, v_changed_new);
    RETURN NEW;

  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, actor_id, actor_name, actor_role, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, v_actor_id, v_actor_name, v_actor_role, to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, actor_id, actor_name, actor_role, old_values)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, v_actor_id, v_actor_name, v_actor_role, to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER audit_loan_offers
  AFTER INSERT OR UPDATE OR DELETE ON public.loan_offers
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
