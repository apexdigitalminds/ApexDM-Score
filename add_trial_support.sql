-- Add trial support to communities table
-- Run this migration in your Supabase SQL editor

ALTER TABLE communities
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS trial_used BOOLEAN DEFAULT FALSE;

-- Update existing nullable trialEndsAt if needed
COMMENT ON COLUMN communities.trial_ends_at IS 'Timestamp when trial expires (null if not on trial)';
COMMENT ON COLUMN communities.trial_used IS 'Whether user has already used their one-time trial';
