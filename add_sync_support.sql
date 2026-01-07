-- Add activity sync support
-- Run this migration in your Supabase SQL editor

-- 1. Add last_sync_at to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ;

COMMENT ON COLUMN profiles.last_sync_at IS 'Last time user synced their activity from Whop';

-- 2. Create rewarded_activities table for deduplication
CREATE TABLE IF NOT EXISTS rewarded_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL, -- 'chat_message', 'forum_post', 'course_lesson'
    external_id TEXT NOT NULL,   -- Whop message/post/lesson ID
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profile_id, activity_type, external_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_rewarded_profile ON rewarded_activities(profile_id);
CREATE INDEX IF NOT EXISTS idx_rewarded_lookup ON rewarded_activities(profile_id, activity_type, external_id);

COMMENT ON TABLE rewarded_activities IS 'Tracks which Whop activities have already been rewarded with XP to prevent duplicates';
