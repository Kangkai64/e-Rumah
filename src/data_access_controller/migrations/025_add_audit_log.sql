-- Migration 025: Append-only audit log, wired up for applications.
--
-- The applications table has no change history - every UPDATE overwrites
-- remarks/status/approved_amount/etc. in place, and the *_at timestamp
-- columns (submitted_at, approved_at, rejected_at, ...) only ever hold the
-- most recent occurrence, not a sequence of transitions. If an application
-- is rejected and later re-reviewed and approved, rejected_at still shows
-- the first pass and nothing records the order of events or who did what.
--
-- This adds a generic audit_log table plus a trigger function that records
-- only the columns that actually changed on UPDATE (full row on INSERT/
-- DELETE), so "what changed, by whom, and when" can be reconstructed and a
-- prior state can be replayed by hand from old_values. Wired up for
-- public.applications only - attach the same trigger to another table with
-- one more CREATE TRIGGER using audit_trigger_fn().
--
-- Not a true rollback mechanism: nothing here undoes a change automatically,
-- it only makes the history queryable so a rollback can be applied manually
-- (e.g. UPDATE applications SET status = old_values->>'status' WHERE ...).

CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  actor_id uuid NULL, -- auth.uid() at write time; NULL when written by service role / edge function
  old_values jsonb NULL,
  new_values jsonb NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_log_entity ON public.audit_log USING btree (entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_log_actor ON public.audit_log USING btree (actor_id);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit log" ON public.audit_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );
-- No INSERT/UPDATE/DELETE policy for any role: rows are only ever written by
-- audit_trigger_fn(), which is SECURITY DEFINER and so bypasses RLS. Nobody,
-- including admins, can edit or delete an audit row through the API.

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
BEGIN
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

    INSERT INTO public.audit_log (entity_type, entity_id, action, actor_id, old_values, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), v_changed_old, v_changed_new);
    RETURN NEW;

  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, actor_id, new_values)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, auth.uid(), to_jsonb(NEW));
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log (entity_type, entity_id, action, actor_id, old_values)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
END;
$$;

CREATE TRIGGER audit_applications
  AFTER INSERT OR UPDATE OR DELETE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger_fn();
