-- Remove healthcare_provider column from health_reports table
ALTER TABLE health_reports 
DROP COLUMN IF EXISTS healthcare_provider;

-- Drop the associated index if it exists
DROP INDEX IF EXISTS idx_health_reports_healthcare_provider;