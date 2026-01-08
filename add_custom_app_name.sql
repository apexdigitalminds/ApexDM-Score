-- Migration: Add custom app name column to communities table
-- This allows white-label communities to customize the app display name

-- Add custom_app_name column
ALTER TABLE communities ADD COLUMN IF NOT EXISTS custom_app_name TEXT;

-- Add comment for documentation
COMMENT ON COLUMN communities.custom_app_name IS 'Custom app name for white-label branding (e.g., "Daily Score" instead of "ApexDM Score")';
