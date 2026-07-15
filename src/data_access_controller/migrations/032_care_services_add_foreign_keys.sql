-- Migration 032: Add missing foreign keys on public.care_services
--
-- care_services.caregiver_id and care_services.healthcare_provider_id have
-- always been plain uuid columns with no FK constraint, unlike elder_id
-- (which references public.users). This let rows point at caregiver/
-- healthcare_provider ids that don't actually exist in
-- public.caregivers/public.healthcare_providers, and meant Postgres/
-- PostgREST couldn't use them for join inference (e.g. Supabase's
-- `.select('*, caregiver:caregivers(*)')` embedding syntax).
--
-- Run this manually in the Supabase SQL Editor - it is not applied by any
-- migration runner.

ALTER TABLE public.care_services
  ADD CONSTRAINT care_service_caregiver_id_fkey FOREIGN KEY (caregiver_id)
    REFERENCES public.caregivers (id) ON DELETE CASCADE,
  ADD CONSTRAINT care_service_healthcare_provider_id_fkey FOREIGN KEY (healthcare_provider_id)
    REFERENCES public.healthcare_providers (id) ON DELETE CASCADE;
