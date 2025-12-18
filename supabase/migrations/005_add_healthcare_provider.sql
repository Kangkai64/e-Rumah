-- Add healthcare_provider column to health_reports table
ALTER TABLE health_reports 
ADD COLUMN healthcare_provider text;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_health_reports_healthcare_provider 
ON health_reports USING btree (healthcare_provider);