-- Migration 030: Let admins upload the valuation report on behalf of an applicant.
--
-- PropertyValuation.completeValuation() (see migration 022) uploads the
-- valuer's report via the normal uploadDocument(file, userId, 'valuationReport')
-- path, writing to storage bucket "application-documents" under the
-- *applicant's* user id folder - not the admin's. Like all storage buckets in
-- this project, its policies were created directly in the Supabase dashboard
-- (see the KNOWN GAPS note at the top of schema.sql) and only ever granted
-- the owning applicant INSERT rights into their own folder
-- ((storage.foldername(name))[1] = auth.uid()::text). An admin's uid never
-- matches that folder, so the upload was rejected with:
--   StorageApiError: new row violates row-level security policy
--
-- This adds a narrowly-scoped admin INSERT policy: admins may only write
-- files whose name starts with the "valuationReport_" prefix (the same
-- prefix Application.getRequiredDocuments matches on), not arbitrary
-- documents in an applicant's folder.
--
-- Run this manually in the Supabase SQL Editor - it is not applied by any
-- migration runner.

CREATE POLICY "Admins can upload valuation reports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'application-documents'
    AND storage.filename(name) LIKE 'valuationReport\_%' ESCAPE '\'
    AND EXISTS (SELECT 1 FROM public.admins WHERE admins.id = auth.uid())
  );
