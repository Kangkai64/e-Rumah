-- Add scheme_name, district, and mukim to properties table
-- Migration 015: Required by the property value estimator (scheme/district/mukim
-- are inputs to the XGBoost model) and by User.reestimatePropertyValue()

ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS scheme_name TEXT,
ADD COLUMN IF NOT EXISTS district TEXT,
ADD COLUMN IF NOT EXISTS mukim TEXT;

COMMENT ON COLUMN public.properties.scheme_name IS 'Scheme / Taman name, used as an input to the property value estimator';
COMMENT ON COLUMN public.properties.district IS 'District, used as an input to the property value estimator';
COMMENT ON COLUMN public.properties.mukim IS 'Mukim, used as an input to the property value estimator';
