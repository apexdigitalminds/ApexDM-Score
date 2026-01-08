-- Add experience_id column to communities table
-- This is required for forum posts and course sync via Whop API

-- 1. Add the column (nullable initially)
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS experience_id TEXT;

-- 2. Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_communities_experience_id ON communities(experience_id);

-- MANUAL STEP REQUIRED:
-- After running this migration, you need to update each community with its experience_id.
-- You can find the experience_id in your Whop dashboard - it starts with "exp_"
-- 
-- Example:
-- UPDATE communities SET experience_id = 'exp_xxxxxxxxxxxxx' WHERE id = 'your-community-id';
--
-- Or the app will automatically capture it when users access the app through Whop.
