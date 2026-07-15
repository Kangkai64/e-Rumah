-- Migration 030: RLS for caregivers/healthcare_providers/family_members/care_services
--
-- These four tables have had no RLS policies at all since they were created
-- (see KNOWN GAPS #3 in schema.sql) - anyone with the anon key could read or
-- write them directly. This also silently broke the health report "Share
-- with Caregiver/Family/Healthcare Provider" flow (src/models/HealthReport.js),
-- which looks up the recipient by email against public.users - a table whose
-- existing RLS policy ("Users can view own data", auth.uid() = id) means that
-- lookup for anyone other than yourself always returned nothing.
--
-- This migration:
--   1. Enables RLS on caregivers, healthcare_providers, family_members, and
--      care_services with policies scoped to the people actually involved.
--   2. Adds an additional SELECT policy on public.users so an elder can read
--      the name/email of a caregiver/healthcare provider they have an active
--      care_services contract with, or a verified family member - needed so
--      the share modal's dropdowns can display those names. This is additive
--      (Postgres OR's multiple permissive policies together) and does not
--      change the existing "Users can view own data" policy.
--
-- Run this once in the Supabase SQL editor.

ALTER TABLE public.caregivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.healthcare_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.care_services ENABLE ROW LEVEL SECURITY;

-- ---- caregivers ----

CREATE POLICY "Caregivers can view own profile" ON public.caregivers
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Caregivers can update own profile" ON public.caregivers
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Elders can view contracted caregivers" ON public.caregivers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.care_services cs
      WHERE cs.caregiver_id = caregivers.id AND cs.elder_id = auth.uid()
    )
  );
CREATE POLICY "Admins can manage caregivers" ON public.caregivers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

-- ---- healthcare_providers ----

CREATE POLICY "Healthcare providers can view own profile" ON public.healthcare_providers
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Healthcare providers can update own profile" ON public.healthcare_providers
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Elders can view contracted healthcare providers" ON public.healthcare_providers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.care_services cs
      WHERE cs.healthcare_provider_id = healthcare_providers.id AND cs.elder_id = auth.uid()
    )
  );
CREATE POLICY "Admins can manage healthcare providers" ON public.healthcare_providers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

-- ---- family_members ----

CREATE POLICY "Elders can manage own family members" ON public.family_members
  FOR ALL USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Family members can view own relationship" ON public.family_members
  FOR SELECT USING (auth.uid() = family_member_user_id);
CREATE POLICY "Admins can manage family members" ON public.family_members
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

-- ---- care_services ----

CREATE POLICY "Elders can manage own care services" ON public.care_services
  FOR ALL USING (auth.uid() = elder_id) WITH CHECK (auth.uid() = elder_id);
CREATE POLICY "Caregivers can view own care services" ON public.care_services
  FOR SELECT USING (auth.uid() = caregiver_id);
CREATE POLICY "Healthcare providers can view own care services" ON public.care_services
  FOR SELECT USING (auth.uid() = healthcare_provider_id);
CREATE POLICY "Admins can manage care services" ON public.care_services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );

-- ---- users: let an elder read who they're sharing with ----

CREATE POLICY "Users can view linked care contacts" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.care_services cs
      WHERE cs.elder_id = auth.uid()
        AND (cs.caregiver_id = users.id OR cs.healthcare_provider_id = users.id)
        AND (cs.end_date IS NULL OR cs.end_date >= CURRENT_DATE)
    )
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.id = auth.uid()
        AND fm.family_member_user_id = users.id
        AND fm.is_verified = true
    )
  );
