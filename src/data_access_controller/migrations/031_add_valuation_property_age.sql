-- Migration 031: Let the admin optionally record the valuer's assessed
-- property age when completing a valuation (see migration 022).
--
-- "Property Age" in MaintainApplicationView was previously always derived
-- client-side from the applicant's self-reported purchase year
-- (currentYear - formData.purchaseYear), which is really ownership
-- duration, not the building's actual age. This column lets an admin
-- override that with the valuer's real figure; the UI falls back to the
-- purchase-year calculation when it's left blank.
--
-- Run this manually in the Supabase SQL Editor - it is not applied by any
-- migration runner.

ALTER TABLE public.property_valuation_schedules
  ADD COLUMN result_property_age integer NULL;
