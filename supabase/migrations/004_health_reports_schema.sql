-- Health Reports Feature Migration
-- Creates tables and storage for health report management

-- ============================================================================
-- HEALTH REPORTS TABLE (Already implemented in main schema)
-- This table is created via the main database schema
-- ============================================================================

-- The health_reports table is defined as:
-- CREATE TABLE public.health_reports (
--   id uuid not null default extensions.uuid_generate_v4 (),
--   user_id uuid not null,
--   application_id uuid null,
--   report_date date not null,
--   report_type text null,
--   report_file_url text null,
--   notes text null,
--   created_at timestamp with time zone null default now(),
--   updated_at timestamp with time zone null default now(),
--   constraint health_reports_pkey primary key (id),
--   constraint health_reports_application_id_fkey foreign KEY (application_id) references applications (id) on delete set null,
--   constraint health_reports_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
-- ) TABLESPACE pg_default;

-- ============================================================================
-- HEALTH REPORT SHARES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.health_report_shares (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  report_id UUID NOT NULL REFERENCES public.health_reports(id) ON DELETE CASCADE,
  shared_with_type TEXT NOT NULL CHECK (shared_with_type IN (
    'caregiver',
    'family',
    'healthcare_provider',
    'public_link',
    'email'
  )),
  shared_with_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  share_token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER DEFAULT 0
) TABLESPACE pg_default;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_health_report_shares_report_id ON public.health_report_shares USING BTREE (report_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_health_report_shares_share_token ON public.health_report_shares USING BTREE (share_token) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_health_report_shares_shared_with_id ON public.health_report_shares USING BTREE (shared_with_id) TABLESPACE pg_default;

-- Add trigger to update the updated_at column
CREATE TRIGGER update_health_report_shares_updated_at BEFORE
UPDATE ON public.health_report_shares FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

-- Create storage bucket for health reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('health-reports', 'health-reports', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on health_reports table
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own health reports
DROP POLICY IF EXISTS "Users can view their own health reports" ON public.health_reports;
CREATE POLICY "Users can view their own health reports"
ON public.health_reports
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own health reports
DROP POLICY IF EXISTS "Users can insert their own health reports" ON public.health_reports;
CREATE POLICY "Users can insert their own health reports"
ON public.health_reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own health reports
DROP POLICY IF EXISTS "Users can update their own health reports" ON public.health_reports;
CREATE POLICY "Users can update their own health reports"
ON public.health_reports
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own health reports
DROP POLICY IF EXISTS "Users can delete their own health reports" ON public.health_reports;
CREATE POLICY "Users can delete their own health reports"
ON public.health_reports
FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on health_report_shares table
ALTER TABLE public.health_report_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view shares for their reports or reports shared with them
DROP POLICY IF EXISTS "Users can view shares for their reports" ON public.health_report_shares;
CREATE POLICY "Users can view shares for their reports"
ON public.health_report_shares
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.health_reports
    WHERE public.health_reports.id = public.health_report_shares.report_id
    AND public.health_reports.user_id = auth.uid()
  )
  OR shared_with_id = auth.uid()
);

-- Policy: Users can create shares for their reports
DROP POLICY IF EXISTS "Users can create shares for their reports" ON public.health_report_shares;
CREATE POLICY "Users can create shares for their reports"
ON public.health_report_shares
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.health_reports
    WHERE public.health_reports.id = public.health_report_shares.report_id
    AND public.health_reports.user_id = auth.uid()
  )
);

-- Policy: Users can update shares for their reports
DROP POLICY IF EXISTS "Users can update shares for their reports" ON public.health_report_shares;
CREATE POLICY "Users can update shares for their reports"
ON public.health_report_shares
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.health_reports
    WHERE public.health_reports.id = public.health_report_shares.report_id
    AND public.health_reports.user_id = auth.uid()
  )
);

-- Policy: Users can delete shares for their reports
DROP POLICY IF EXISTS "Users can delete shares for their reports" ON public.health_report_shares;
CREATE POLICY "Users can delete shares for their reports"
ON public.health_report_shares
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.health_reports
    WHERE public.health_reports.id = public.health_report_shares.report_id
    AND public.health_reports.user_id = auth.uid()
  )
);

-- ============================================================================
-- STORAGE POLICIES
-- ============================================================================

-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload files to their own folder
DROP POLICY IF EXISTS "Users can upload to their own folder" ON storage.objects;
CREATE POLICY "Users can upload to their own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'health-reports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view files in their own folder and public files
DROP POLICY IF EXISTS "Users can view files in their own folder" ON storage.objects;
CREATE POLICY "Users can view files in their own folder"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'health-reports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can update files in their own folder
DROP POLICY IF EXISTS "Users can update files in their own folder" ON storage.objects;
CREATE POLICY "Users can update files in their own folder"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'health-reports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'health-reports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can delete files in their own folder
DROP POLICY IF EXISTS "Users can delete files in their own folder" ON storage.objects;
CREATE POLICY "Users can delete files in their own folder"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'health-reports' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to check if share link is expired
CREATE OR REPLACE FUNCTION public.is_share_link_valid(token TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  share_record RECORD;
BEGIN
  SELECT * INTO share_record
  FROM public.health_report_shares
  WHERE share_token = token;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  IF share_record.expires_at IS NOT NULL AND share_record.expires_at < NOW() THEN
    RETURN FALSE;
  END IF;

  -- Update access count
  UPDATE public.health_report_shares
  SET access_count = access_count + 1,
      accessed_at = NOW()
  WHERE share_token = token;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.health_reports IS 'Stores health reports uploaded by users with optional application association';
COMMENT ON TABLE public.health_report_shares IS 'Tracks sharing of health reports with others';
COMMENT ON COLUMN public.health_reports.report_type IS 'Type of health report: Medical Report, Lab Test, Prescription, Vaccination Record, Doctor's Visit Summary';
COMMENT ON COLUMN public.health_reports.application_id IS 'Optional reference to the application this report is associated with';
COMMENT ON COLUMN public.health_report_shares.shared_with_type IS 'Type of share: caregiver, family, healthcare_provider, public_link, email';
COMMENT ON COLUMN public.health_report_shares.share_token IS 'Unique token for public link sharing';
COMMENT ON COLUMN public.health_report_shares.expires_at IS 'Expiration date for shareable links';
