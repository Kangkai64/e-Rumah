-- Enable RLS (no-op if already enabled)
ALTER TABLE IF EXISTS public.customer_support_inquiries ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to UPDATE inquiries
-- Note: adjust this to your staff role rules if needed.
-- For a staff-only policy, see the commented example below.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'customer_support_inquiries'
      AND policyname = 'support_update_inquiries'
  ) THEN
    CREATE POLICY support_update_inquiries
      ON public.customer_support_inquiries
      FOR UPDATE
      USING (auth.role() = 'authenticated')
      WITH CHECK (auth.role() = 'authenticated');
  END IF;
END$$;

-- Optional: staff-only variant (uncomment and adjust if you have a users.type column)
-- DO $$
-- BEGIN
--   IF NOT EXISTS (
--     SELECT 1 FROM pg_policies
--     WHERE schemaname = 'public'
--       AND tablename = 'customer_support_inquiries'
--       AND policyname = 'staff_update_inquiries'
--   ) THEN
--     CREATE POLICY staff_update_inquiries
--       ON public.customer_support_inquiries
--       FOR UPDATE
--       USING (
--         auth.uid() IN (
--           SELECT id FROM public.users WHERE type IN ('staff','admin')
--         )
--       )
--       WITH CHECK (
--         auth.uid() IN (
--           SELECT id FROM public.users WHERE type IN ('staff','admin')
--         )
--       );
--   END IF;
-- END$$;