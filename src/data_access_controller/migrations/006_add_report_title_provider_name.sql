-- Add report title and provider name fields to health_reports table
-- Migration 006: Add report title and provider name fields

-- Add new columns
ALTER TABLE public.health_reports 
ADD COLUMN report_title text,
ADD COLUMN provider_name text;

-- Add comments for documentation
COMMENT ON COLUMN public.health_reports.report_title IS 'User-provided title for the health report';
COMMENT ON COLUMN public.health_reports.provider_name IS 'Name of the healthcare provider or facility that issued the report';

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_health_reports_report_title ON public.health_reports USING gin (to_tsvector('english', report_title));
CREATE INDEX IF NOT EXISTS idx_health_reports_provider_name ON public.health_reports USING gin (to_tsvector('english', provider_name));