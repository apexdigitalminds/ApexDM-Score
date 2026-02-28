-- =============================================================================
-- Migration: Multi-Community Profile Isolation
-- Date: 2026-02-28
-- =============================================================================
-- PROBLEM: profiles.whop_user_id was UNIQUE globally, meaning one user could
-- only belong to one community at a time. This caused profile "hijacking" when
-- a member accessed the app under a different community.
--
-- FIX: Change to UNIQUE(whop_user_id, community_id) so each user gets a
-- separate, fully isolated profile per community they are a member of.
--
-- IMPACT:
--   - profiles: constraint change only (no row data changes)
--   - user_badges, user_inventory, actions_log, user_active_effects:
--     already have community_id — no changes needed
--   - user_quest_progress: no community_id column, but isolation is
--     automatically achieved because user_id points to a community-scoped
--     profile UUID after this fix. No schema change required.
-- =============================================================================

-- Step 1: Drop the two existing single-column unique constraints
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_whop_user_id_key;
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_whop_user_id_unique;

-- Step 2: Add the new composite unique constraint
ALTER TABLE profiles
  ADD CONSTRAINT profiles_whop_user_community_unique
  UNIQUE (whop_user_id, community_id);

-- =============================================================================
-- VERIFICATION QUERY (run after migration to confirm):
-- =============================================================================
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'profiles';
--
-- Expected: profiles_whop_user_community_unique (UNIQUE)
-- Old constraints should NOT appear.
-- =============================================================================
