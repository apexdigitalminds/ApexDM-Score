"use server";

import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidatePath } from "next/cache";
import { StoreItem, ActionType, AnalyticsData, Profile, User, Badge, Quest } from "@/types";

// =============================================================================
// 🟢 AUTHENTICATION & CONTEXT RESOLUTION
// =============================================================================

/**
 * Verifies the current user's Whop token and resolves their profile in the database.
 * 
 * FLOW:
 * 1. Verify Whop JWT token from headers
 * 2. Check if user exists in our database
 * 3. If exists: return their session
 * 4. If not exists: provision them (only if we have company_id)
 * 
 * @param routeCompanyId - Optional company_id from the route (e.g., from experienceId lookup)
 * @returns Session object with userId, role, etc. or null if auth fails
 */
export async function verifyUser(routeCompanyId?: string) {
  try {
    const rawHeaders = await headers();

    // 🛡️ Step 1: Verify Whop Token
    let payload;
    try {
      payload = await whopsdk.verifyUserToken(rawHeaders);
    } catch (sdkError) {
      console.error("❌ SDK Token Verification Failed:", sdkError);
      return null;
    }

    const token = payload as any || {};
    const whopUserId = token.userId || token.sub;
    const roles = token.roles || [];

    if (!whopUserId) {
      console.error("❌ No whopUserId in token");
      return null;
    }

    console.log(`🔐 Verifying user: ${whopUserId}${routeCompanyId ? ` for company: ${routeCompanyId}` : ''}`);

    // 🟢 Step 2: Check if User Exists in Database
    const { data: existingProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, community_id, whop_user_id, username, communities(id, whop_store_id, whop_company_id, name)')
      .eq('whop_user_id', whopUserId)
      .maybeSingle();

    if (profileError) {
      console.error("❌ Database error checking profile:", profileError);
      return null;
    }

    if (existingProfile) {
      // ✅ User exists in database
      const communityData = existingProfile.communities as any;
      const userCompanyId = communityData?.whop_store_id || communityData?.whop_company_id;

      console.log(`✅ User found in DB: ${existingProfile.username} (${existingProfile.id})`);
      console.log(`   Community: ${communityData?.name} (${existingProfile.community_id})`);
      console.log(`   Role: ${existingProfile.role}`);

      // 🔍 Optional: Verify company match (for security/debugging)
      // 🔧 FIX: Compare routeCompanyId against BOTH Supabase UUID and Whop ID
      const communitySupabaseId = existingProfile.community_id;
      const communityWhopId = communityData?.whop_store_id || communityData?.whop_company_id;

      // Route could be either Supabase UUID or Whop biz_xxx format
      const routeMatchesSupabaseId = routeCompanyId === communitySupabaseId;
      const routeMatchesWhopId = routeCompanyId === communityWhopId;

      if (routeCompanyId && !routeMatchesSupabaseId && !routeMatchesWhopId) {
        console.warn(`⚠️ COMPANY MISMATCH:`);
        console.warn(`   User's community (Supabase): ${communitySupabaseId}`);
        console.warn(`   User's community (Whop): ${communityWhopId}`);
        console.warn(`   Route company: ${routeCompanyId}`);
        console.warn(`   This could indicate:`);
        console.warn(`   1. User switching between companies (ok if intentional)`);
        console.warn(`   2. Security issue (investigate)`);
        // For now we allow it, but you could block cross-company access here
      } else if (routeCompanyId) {
        console.log(`   Route matches: ${routeMatchesSupabaseId ? 'Supabase ID' : routeMatchesWhopId ? 'Whop ID' : 'Unknown'}`);
      }

      return {
        userId: existingProfile.id,
        whopUserId,
        isAdmin: existingProfile.role === 'admin',
        communityId: existingProfile.community_id,
        role: existingProfile.role
      };
    }

    // 🟢 Step 3: User Not in Database - Attempt Provisioning
    console.log(`⚠️ User ${whopUserId} not found in database`);
    console.log(`   This happens when:`);
    console.log(`   1. First time login (normal)`);
    console.log(`   2. Webhook hasn't fired yet (wait 30 sec)`);
    console.log(`   3. Webhook failed (check logs)`);

    if (!routeCompanyId) {
      console.error("❌ CRITICAL: Cannot provision user without company_id");
      console.error("   User: ${whopUserId}");
      console.error("   Company ID: NOT PROVIDED");
      console.error("   ");
      console.error("   Fix: Ensure you're calling verifyUser(companyId)");
      console.error("   In experiences route: use getCompanyIdFromExperience()");
      return null;
    }

    // Provision the user NOW
    console.log(`🚀 Provisioning user ${whopUserId} for company ${routeCompanyId}`);

    const provisioned = await ensureWhopContext(routeCompanyId, whopUserId, roles);

    if (!provisioned) {
      console.error("❌ Provisioning failed - check ensureWhopContext logs above");
      return null;
    }

    // 🟢 Step 4: Fetch Newly Created Profile
    const { data: newProfile, error: newProfileError } = await supabaseAdmin
      .from('profiles')
      .select('id, role, community_id, username')
      .eq('whop_user_id', whopUserId)
      .maybeSingle();

    if (newProfileError || !newProfile) {
      console.error("❌ User still not in DB after provisioning");
      console.error("   Error:", newProfileError);
      return null;
    }

    console.log(`✅ User provisioned successfully: ${newProfile.username} (${newProfile.id}) as ${newProfile.role}`);

    return {
      userId: newProfile.id,
      whopUserId,
      isAdmin: newProfile.role === 'admin',
      communityId: newProfile.community_id,
      role: newProfile.role
    };

  } catch (error: any) {
    console.error("❌ verifyUser Fatal Error:", error.message);
    console.error(error.stack);
    return null;
  }
}

/**
 * Maps Whop plan IDs to application tiers
 * @param planId - Whop plan_id from webhook payload
 * @param productTitle - Fallback to product title if plan_id not found
 * @returns Tier name and whether it's a trial
 */
function mapPlanIdToTier(planId?: string, productTitle?: string): { tier: string; isTrial: boolean } {
  // 🎯 Whop Plan ID Mappings
  const PLAN_MAP: Record<string, { tier: string; isTrial: boolean }> = {
    // Core Tier
    'plan_e4FFt094Axfgf': { tier: 'Core', isTrial: false },  // Core Monthly
    'plan_HfEDkPud0jADY': { tier: 'Core', isTrial: false },  // Core Annual

    // Pro Tier
    'plan_O0478GuOZrGgB': { tier: 'Pro', isTrial: false },   // Pro Monthly
    'plan_05xorDNeY0eQs': { tier: 'Pro', isTrial: false },   // Pro Annual

    // Elite Tier
    'plan_hytzupiY3xjGm': { tier: 'Elite', isTrial: false }, // Elite Monthly
    'plan_RXAfXSbUVzWgl': { tier: 'Elite', isTrial: false }, // Elite Annual

    // 🆕 Trial Tier (14-Day Elite)
    'plan_1O9ya9RWXWrzr': { tier: 'trial', isTrial: true },  // Trial Monthly
    'plan_zfvJ8bKMvthir': { tier: 'trial', isTrial: true },  // Trial Annual
  };

  // Try plan_id first
  if (planId && PLAN_MAP[planId]) {
    return PLAN_MAP[planId];
  }

  // Fallback to product title parsing
  if (productTitle) {
    const title = productTitle.toLowerCase();
    if (title.includes('trial')) return { tier: 'trial', isTrial: true };
    if (title.includes('elite')) return { tier: 'Elite', isTrial: false };
    if (title.includes('pro')) return { tier: 'Pro', isTrial: false };
    if (title.includes('core')) return { tier: 'Core', isTrial: false };
  }

  // Default to Free if nothing matches
  return { tier: 'Free', isTrial: false };
}

/**
 * Ensures a community exists for a Whop store and links a user to it.
 * This is called by both the webhook and the fallback auth flow.
 * 
 * @param whopStoreId - The Whop company/store ID
 * @param whopUserId - The Whop user ID
 * @param tokenRoles - Roles from Whop token (owner, admin, member, etc.)
 * @param productTitle - The product/plan name from Whop (e.g., "Core", "Pro", "Elite")
 * @param planId - The Whop plan_id for accurate tier mapping
 * @returns true if successful, false otherwise
 */
export async function ensureWhopContext(
  whopStoreId: string,
  whopUserId: string,
  tokenRoles: string[] = [],
  productTitle?: string,
  planId?: string  // 🆕 Added planId parameter
) {
  if (!whopStoreId || !whopUserId) {
    console.error("❌ ensureWhopContext: Missing required parameters");
    console.error(`   whopStoreId: ${whopStoreId || 'MISSING'}`);
    console.error(`   whopUserId: ${whopUserId || 'MISSING'}`);
    return false;
  }

  console.log(`🔧 ensureWhopContext START`);
  console.log(`   Store ID: ${whopStoreId}`);
  console.log(`   User ID: ${whopUserId}`);
  console.log(`   Roles: [${tokenRoles.join(', ')}]`);
  console.log(`   Product/Tier: ${productTitle || 'Not provided'}`);
  console.log(`   Plan ID: ${planId || 'Not provided'}`);

  // 🎯 Map plan ID to tier
  const { tier: mappedTier, isTrial } = mapPlanIdToTier(planId, productTitle);
  console.log(`   Mapped Tier: ${mappedTier} ${isTrial ? '(TRIAL)' : ''}`);

  // 🆕 Calculate trial expiration if needed
  let trialEndsAt: string | null = null;
  if (isTrial) {
    const now = new Date();
    const expirationDate = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days
    trialEndsAt = expirationDate.toISOString();
    console.log(`   Trial expires: ${trialEndsAt}`);
  }

  // 🚨 CRITICAL FIX: Handle seller company webhooks specially
  // When webhook comes from seller company (Apex Digital Minds), we should NOT
  // move the user to that community. Instead, find their EXISTING community 
  // and update its tier.
  const SELLER_COMPANY_ID = 'biz_l6rgQaulWP7D2E';

  if (whopStoreId === SELLER_COMPANY_ID) {
    console.log(`⚠️ SELLER COMPANY DETECTED in ensureWhopContext`);
    console.log(`   This is a tier upgrade webhook, not a new community`);
    console.log(`   Looking up user's existing community to update tier...`);

    // Find user's existing profile and community
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('id, community_id, role, communities(id, name, subscription_tier)')
      .eq('whop_user_id', whopUserId)
      .maybeSingle();

    if (profileError) {
      console.error(`❌ Error finding user profile:`, profileError);
      return false;
    }

    if (!userProfile) {
      console.warn(`⚠️ No existing profile for user ${whopUserId}`);
      console.warn(`   Cannot update tier without existing community`);
      console.warn(`   User may need to access app first to create profile`);
      return false;
    }

    const userCommunity = userProfile.communities as any;
    console.log(`✅ Found user's existing community: ${userCommunity?.name} (${userProfile.community_id})`);
    console.log(`   Current tier: ${userCommunity?.subscription_tier}`);

    // Update the user's existing community tier
    if (mappedTier && userCommunity?.subscription_tier !== mappedTier) {
      console.log(`🔄 Updating user's community tier: ${userCommunity?.subscription_tier} → ${mappedTier}`);

      const updateData: any = { subscription_tier: mappedTier };
      if (isTrial) {
        updateData.trial_ends_at = trialEndsAt;
        updateData.trial_used = true;
      }

      const { error: updateError } = await supabaseAdmin
        .from('communities')
        .update(updateData)
        .eq('id', userProfile.community_id);

      if (updateError) {
        console.error(`❌ Failed to update community tier:`, updateError);
        return false;
      }

      console.log(`✅ Community tier updated to: ${mappedTier}`);
    } else {
      console.log(`ℹ️ Tier unchanged or no tier to update`);
    }

    console.log(`✅ Seller company webhook handled - user stays in their community`);
    return true;
  }

  let communityId: string | null = null;
  let isNewCommunity = false;

  // =============================================================================
  // 🟢 STEP 1: Find or Create Community
  // =============================================================================

  const { data: existingComm, error: findError } = await supabaseAdmin
    .from('communities')
    .select('id, name, whop_store_id, subscription_tier')
    .eq('whop_store_id', whopStoreId)
    .maybeSingle();

  if (findError) {
    console.error("❌ Error searching for community:", findError);
    return false;
  }

  if (existingComm) {
    communityId = existingComm.id;
    console.log(`✅ Community found: "${existingComm.name}" (${communityId})`);
    console.log(`   Current tier: ${existingComm.subscription_tier}`);

    // 🔄 Update tier if we have new tier information and it's different
    if (mappedTier && existingComm.subscription_tier !== mappedTier) {
      console.log(`🔄 Updating community tier: ${existingComm.subscription_tier} → ${mappedTier}`);

      const updateData: any = { subscription_tier: mappedTier };

      // 🆕 Set trial fields if tier is trial
      if (isTrial) {
        updateData.trial_ends_at = trialEndsAt;
        updateData.trial_used = true;
        console.log(`   Setting trial expiration: ${trialEndsAt}`);
      } else {
        // Clear trial fields if upgrading from trial to paid
        updateData.trial_ends_at = null;
      }

      const { error: updateError } = await supabaseAdmin
        .from('communities')
        .update(updateData)
        .eq('id', communityId);

      if (updateError) {
        console.error("⚠️ Failed to update community tier:", updateError);
        // Don't fail the whole operation, just log it
      } else {
        console.log(`✅ Community tier updated to: ${mappedTier}`);
      }
    }

  } else {
    isNewCommunity = true;
    console.log(`✨ Creating NEW community for store: ${whopStoreId}`);

    // 🎯 Determine initial tier using plan ID mapping
    const initialTier = mappedTier;
    console.log(`   Initial tier: ${initialTier}${isTrial ? ' (TRIAL - 14 days)' : ''}`);

    const insertData: any = {
      whop_store_id: whopStoreId,
      whop_company_id: whopStoreId,
      name: `Community ${whopStoreId.substring(0, 8)}`,
      subscription_tier: initialTier,
    };

    // 🆕 Add trial fields if tier is trial
    if (isTrial) {
      insertData.trial_ends_at = trialEndsAt;
      insertData.trial_used = true;
      console.log(`   Trial expiration set: ${trialEndsAt}`);
    }

    const { data: newComm, error: createError } = await supabaseAdmin
      .from('communities')
      .insert(insertData)
      .select('id, name, subscription_tier')
      .single();

    if (createError || !newComm) {
      console.error("❌ Failed to create community:", createError);
      return false;
    }

    communityId = newComm.id;
    console.log(`✅ Community created: "${newComm.name}" (${communityId})`);
    console.log(`   Tier: ${newComm.subscription_tier}`);

    // =========================================================================
    // 🌱 STEP 1.5: Seed Default Reward Actions
    // =========================================================================
    console.log(`🌱 Seeding default reward actions for community: ${communityId}`);

    const defaultRewardActions = [
      { action_type: 'daily_login', display_name: 'Daily Login', xp_gained: 10, is_active: true, is_archived: false },
      { action_type: 'lesson_completed', display_name: 'Complete a Lesson', xp_gained: 50, is_active: true, is_archived: false },
      { action_type: 'subscription_renewed', display_name: 'Subscription Renewal', xp_gained: 200, is_active: true, is_archived: false },
      { action_type: 'post_forum_comment', display_name: 'Forum Post', xp_gained: 5, is_active: true, is_archived: false },
      { action_type: 'post_chat_message', display_name: 'Chat Message', xp_gained: 5, is_active: true, is_archived: false },
      { action_type: 'course_started', display_name: 'Start a Course', xp_gained: 25, is_active: true, is_archived: false },
      { action_type: 'course_completed', display_name: 'Complete a Course', xp_gained: 100, is_active: true, is_archived: false },
      { action_type: 'streak_7_day', display_name: '7-Day Streak', xp_gained: 50, is_active: true, is_archived: false },
      { action_type: 'streak_30_day', display_name: '30-Day Streak', xp_gained: 150, is_active: true, is_archived: false },
      { action_type: 'badge_earned', display_name: 'Badge Earned', xp_gained: 25, is_active: true, is_archived: false },
    ];

    const { error: seedError } = await supabaseAdmin
      .from('reward_actions')
      .insert(defaultRewardActions.map(a => ({ ...a, community_id: communityId })));

    if (seedError) {
      console.warn(`⚠️ Failed to seed reward actions:`, seedError);
      // Don't fail the whole provisioning for this
    } else {
      console.log(`✅ Seeded ${defaultRewardActions.length} default reward actions`);
    }

    // =========================================================================
    // 🏆 STEP 1.6: Seed Default Badges
    // =========================================================================
    console.log(`🏆 Seeding default badges for community: ${communityId}`);

    const defaultBadges = [
      // XP Milestone Badges (auto-trigger)
      { name: 'XP Novice', description: 'Earn your first 100 XP', icon: 'Star', color: '#CD7F32', xp_reward: 10, trigger_type: 'xp_threshold', trigger_value: 100, is_active: true, is_archived: false },
      { name: 'XP Adept', description: 'Accumulate 1,000 XP', icon: 'Star', color: '#C0C0C0', xp_reward: 25, trigger_type: 'xp_threshold', trigger_value: 1000, is_active: true, is_archived: false },
      { name: 'XP Veteran', description: 'Reach 5,000 XP milestone', icon: 'Star', color: '#FFD700', xp_reward: 50, trigger_type: 'xp_threshold', trigger_value: 5000, is_active: true, is_archived: false },
      { name: 'XP Master', description: 'Achieve 10,000 XP mastery', icon: 'Crown', color: '#B9F2FF', xp_reward: 100, trigger_type: 'xp_threshold', trigger_value: 10000, is_active: true, is_archived: false },
      // Streak Badges (auto-trigger)
      { name: '3 Day Streak', description: 'Maintain a 3-day login streak', icon: 'Fire', color: '#CD7F32', xp_reward: 15, trigger_type: 'streak_days', trigger_value: 3, is_active: true, is_archived: false },
      { name: '7 Day Streak', description: 'Keep the fire burning for 7 days', icon: 'Fire', color: '#C0C0C0', xp_reward: 30, trigger_type: 'streak_days', trigger_value: 7, is_active: true, is_archived: false },
      { name: '30 Day Streak', description: 'One month of dedication', icon: 'Fire', color: '#FFD700', xp_reward: 75, trigger_type: 'streak_days', trigger_value: 30, is_active: true, is_archived: false },
      { name: 'Century Club', description: 'Legendary 100-day streak', icon: 'Trophy', color: '#B9F2FF', xp_reward: 200, trigger_type: 'streak_days', trigger_value: 100, is_active: true, is_archived: false },
    ];

    const { error: badgeSeedError } = await supabaseAdmin
      .from('badges')
      .insert(defaultBadges.map(b => ({ ...b, community_id: communityId })));

    if (badgeSeedError) {
      console.warn(`⚠️ Failed to seed badges:`, badgeSeedError);
    } else {
      console.log(`✅ Seeded ${defaultBadges.length} default badges`);
    }

    // =========================================================================
    // 🛒 STEP 1.7: Seed Default Store Items
    // =========================================================================
    console.log(`🛒 Seeding default store items for community: ${communityId}`);

    const defaultStoreItems: any[] = [
      // Powerups
      { name: 'XP Boost', description: '1.5x XP for 24 hours', icon: '⚡', item_type: 'TIMED_EFFECT', cost_xp: 150, duration_hours: 24, modifier: 1.5, is_available: true, is_archived: false, metadata: {} },
      { name: 'Streak Shield', description: 'Protect your streak for 48 hours', icon: '🛡️', item_type: 'STREAK_FREEZE', cost_xp: 300, duration_hours: 48, is_available: true, is_archived: false, metadata: {} },
      // Cosmetics
      { name: 'Golden Frame', description: 'A prestigious golden profile frame', icon: '🖼️', item_type: 'FRAME', cost_xp: 500, is_available: true, is_archived: false, metadata: { color: '#FFD700' } },
      { name: 'Diamond Badge', description: 'Sparkling diamond avatar effect', icon: '💎', item_type: 'AVATAR_PULSE', cost_xp: 1000, is_available: true, is_archived: false, metadata: { color: '#B9F2FF' } },
      { name: 'VIP Title', description: 'Display "VIP" title on your profile', icon: '👑', item_type: 'TITLE', cost_xp: 750, is_available: true, is_archived: false, metadata: { text: 'VIP', color: '#FFD700' } },
    ];

    // Add Elite trial bonus items if applicable
    if (isTrial && mappedTier === 'elite_trial') {
      defaultStoreItems.push(
        { name: 'Double XP Weekend', description: '2x XP for 72 hours - Elite exclusive', icon: '🔥', item_type: 'TIMED_EFFECT', cost_xp: 400, duration_hours: 72, modifier: 2.0, is_available: true, is_archived: false, metadata: {} },
        { name: 'Exclusive Emote Pack', description: 'Special emotes for premium members', icon: '🎨', item_type: 'BANNER', cost_xp: 600, is_available: true, is_archived: false, metadata: { exclusive: true } },
        { name: 'Platinum Profile', description: 'Animated platinum profile effect', icon: '✨', item_type: 'FRAME', cost_xp: 1500, is_available: true, is_archived: false, metadata: { color: '#E5E4E2', animated: true } },
      );
    }

    const { error: storeSeedError } = await supabaseAdmin
      .from('store_items')
      .insert(defaultStoreItems.map(s => ({ ...s, community_id: communityId })));

    if (storeSeedError) {
      console.warn(`⚠️ Failed to seed store items:`, storeSeedError);
    } else {
      console.log(`✅ Seeded ${defaultStoreItems.length} default store items`);
    }

    // =========================================================================
    // 📋 STEP 1.8: Seed Default Quests
    // =========================================================================
    console.log(`📋 Seeding default quests for community: ${communityId}`);

    const defaultQuests = [
      {
        title: 'Getting Started',
        description: 'Complete your first actions in the community',
        xpReward: 50,
        tasks: [
          { actionType: 'daily_login', targetCount: 3, description: 'Log in 3 times' },
        ],
      },
      {
        title: 'Content Explorer',
        description: 'Engage with educational content',
        xpReward: 100,
        tasks: [
          { actionType: 'lesson_completed', targetCount: 3, description: 'Complete 3 lessons' },
        ],
      },
      {
        title: 'Weekly Warrior',
        description: 'Stay consistent throughout the week',
        xpReward: 200,
        tasks: [
          { actionType: 'daily_login', targetCount: 7, description: 'Log in 7 days' },
          { actionType: 'lesson_completed', targetCount: 5, description: 'Complete 5 lessons' },
        ],
      },
    ];

    for (const questData of defaultQuests) {
      const { data: newQuest, error: questError } = await supabaseAdmin
        .from('quests')
        .insert({
          community_id: communityId,
          title: questData.title,
          description: questData.description,
          xp_reward: questData.xpReward,
          is_active: true,
          is_archived: false,
        })
        .select()
        .single();

      if (questError || !newQuest) {
        console.warn(`⚠️ Failed to seed quest "${questData.title}":`, questError);
        continue;
      }

      // Insert quest tasks
      const tasksToInsert = questData.tasks.map(task => ({
        quest_id: newQuest.id,
        action_type: task.actionType,
        target_count: task.targetCount,
        description: task.description,
      }));

      await supabaseAdmin.from('quest_tasks').insert(tasksToInsert);
    }

    console.log(`✅ Seeded ${defaultQuests.length} default quests`);
  }


  // =============================================================================
  // 🟢 STEP 2: Link User to Community
  // =============================================================================

  if (!communityId) {
    console.error("❌ No communityId after community resolution");
    return false;
  }

  const { data: existingProfile, error: profileFindError } = await supabaseAdmin
    .from('profiles')
    .select('id, community_id, role, username, whop_user_id')
    .eq('whop_user_id', whopUserId)
    .maybeSingle();

  if (profileFindError) {
    console.error("❌ Error searching for profile:", profileFindError);
    return false;
  }

  // Determine target role
  const isWhopAdmin = tokenRoles.some(r =>
    ['owner', 'admin', 'staff', 'creator', 'moderator'].includes(r.toLowerCase())
  );

  const targetRole = (isNewCommunity || isWhopAdmin) ? 'admin' : 'member';

  if (existingProfile) {
    console.log(`👤 User profile found: ${existingProfile.username} (${existingProfile.id})`);
    console.log(`   Current community: ${existingProfile.community_id}`);
    console.log(`   Current role: ${existingProfile.role}`);

    const updates: any = {};

    if (existingProfile.community_id !== communityId) {
      console.log(`🔄 Moving user to new community`);
      updates.community_id = communityId;
    }

    if (targetRole === 'admin' && existingProfile.role !== 'admin') {
      console.log(`⬆️ Upgrading user role: ${existingProfile.role} → admin`);
      updates.role = 'admin';
    }

    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', existingProfile.id);

      if (updateError) {
        console.error("❌ Failed to update profile:", updateError);
        return false;
      }
      console.log(`✅ Profile updated successfully`);
    } else {
      console.log(`✅ Profile already correct - no updates needed`);
    }

  } else {
    console.log(`👤 Creating NEW profile`);
    console.log(`   User: ${whopUserId}`);
    console.log(`   Role: ${targetRole}`);
    console.log(`   Community: ${communityId}`);

    const { error: createError } = await supabaseAdmin
      .from('profiles')
      .insert({
        whop_user_id: whopUserId,
        community_id: communityId,
        username: `User_${whopUserId.substring(5, 9)}`,
        role: targetRole,
        xp: 0,
        streak: 0,
        streak_freezes: 0,
      });

    if (createError) {
      console.error("❌ Failed to create profile:", createError);
      return false;
    }
    console.log(`✅ Profile created as ${targetRole}`);
  }

  console.log(`✅ ensureWhopContext completed successfully`);
  return true;
}

// =============================================================================
// 🟢 HELPER FUNCTIONS
// =============================================================================

async function ensureAdmin() {
  const session = await verifyUser();
  if (!session || !session.isAdmin) throw new Error("Forbidden: Admin access required");
  return session;
}

async function getCommunityId(overrideId?: string) {
  if (overrideId) return overrideId;
  const session = await verifyUser();
  if (!session || !session.communityId) throw new Error("No Community Context Found.");
  return session.communityId;
}

export async function validateSessionContext() {
  try {
    const result = await verifyUser();
    if (!result) return { success: false, error: "No Session" };
    return { success: true, communityId: result.communityId, isAdmin: result.isAdmin };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// =============================================================================
// 🟢 IN-APP PURCHASE (iFrameSdk)
// =============================================================================

/**
 * Validates a plan ID for in-app purchases.
 * The iframeSdk.inAppPurchase() handles the checkout directly with planId.
 * 
 * @param planId - The Whop plan ID to purchase
 * @returns Validation result with planId
 */
export async function createCheckoutConfigAction(planId: string) {
  try {
    const session = await verifyUser();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }

    // Validate planId format
    if (!planId || !planId.startsWith('plan_')) {
      return { success: false, error: "Invalid plan ID" };
    }

    // For iframeSdk.inAppPurchase, we just need the planId
    // The SDK handles checkout directly without needing a server-side config
    return {
      success: true,
      planId: planId
    };
  } catch (error: any) {
    console.error("[createCheckoutConfigAction] Error:", error);
    return { success: false, error: error.message || "Validation failed" };
  }
}

// =============================================================================
// 🟢 WHITE-LABEL BRANDING
// =============================================================================

/**
 * Updates community branding settings (Elite tier only).
 * Allows customization of logo, theme color, favicon, footer text, and member count visibility.
 */
export async function updateCommunityBrandingAction(data: {
  whiteLabelEnabled?: boolean;
  logoUrl?: string;
  themeColor?: string;
  faviconUrl?: string;
  customFooterText?: string;
  hideMemberCount?: boolean;
}) {
  try {
    const session = await verifyUser();
    if (!session) {
      return { success: false, error: "Not authenticated" };
    }
    if (!session.isAdmin) {
      return { success: false, error: "Admin access required" };
    }
    if (!session.communityId) {
      return { success: false, error: "No community context" };
    }

    // Build update object with only defined fields
    const updateData: Record<string, any> = {};
    if (data.whiteLabelEnabled !== undefined) updateData.white_label_enabled = data.whiteLabelEnabled;
    if (data.logoUrl !== undefined) updateData.logo_url = data.logoUrl || null;
    if (data.themeColor !== undefined) updateData.theme_color = data.themeColor || null;
    if (data.faviconUrl !== undefined) updateData.favicon_url = data.faviconUrl || null;
    if (data.customFooterText !== undefined) updateData.custom_footer_text = data.customFooterText || null;
    if (data.hideMemberCount !== undefined) updateData.hide_member_count = data.hideMemberCount;

    const { error } = await supabaseAdmin
      .from('communities')
      .update(updateData)
      .eq('id', session.communityId);

    if (error) {
      console.error("[updateCommunityBrandingAction] Error:", error);
      return { success: false, error: error.message };
    }

    revalidatePath('/');
    revalidatePath('/admin');
    return { success: true };
  } catch (error: any) {
    console.error("[updateCommunityBrandingAction] Error:", error);
    return { success: false, error: error.message || "Failed to update branding" };
  }
}

// =============================================================================
// 🟢 EXISTING FUNCTIONS (UNCHANGED)
// =============================================================================
// All your existing functions below remain exactly the same.
// I'm including them for completeness, but they don't need any modifications.

export async function syncUserAction(whopId: string, whopRole: "admin" | "member"): Promise<Profile | null> {
  const { data: existingUser } = await supabaseAdmin.from('profiles').select('*').eq('whop_user_id', whopId).maybeSingle();
  if (existingUser) return existingUser;
  return null;
}

export async function syncCommunityBrandingAction() {
  try {
    const session = await verifyUser();
    if (!session || !session.isAdmin || !session.communityId) throw new Error("Unauthorized");

    const { data: comm } = await supabaseAdmin.from('communities').select('whop_store_id').eq('id', session.communityId).single();
    const realWhopId = comm?.whop_store_id;

    if (!realWhopId) throw new Error("No Whop Store ID linked");

    let companyName = "ApexDM Community";
    let logoUrl = "";

    if (process.env.WHOP_API_KEY) {
      const response = await fetch(`https://api.whop.com/api/v2/companies/${realWhopId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        companyName = data.title || data.name;
        logoUrl = data.image_url || data.logo_url;
      }
    }

    await supabaseAdmin
      .from('communities')
      .update({ name: companyName, logo_url: logoUrl })
      .eq('id', session.communityId);

    revalidatePath('/');
    return { success: true, message: `Synced as: ${companyName}` };

  } catch (e: any) {
    console.error("Sync Branding Error:", e);
    return { success: false, message: e.message };
  }
}

export async function awardBadgeAction(userId: string, badgeName: string) {
  const { data: userProfile } = await supabaseAdmin.from('profiles').select('community_id').eq('id', userId).single();
  if (!userProfile) return { success: false, message: "User not found" };

  // Get badge with xp_reward
  const { data: badge, error: badgeError } = await supabaseAdmin
    .from('badges')
    .select('id, xp_reward')
    .eq('name', badgeName)
    .eq('community_id', userProfile.community_id)
    .single();

  if (badgeError || !badge) return { success: false, message: `Badge '${badgeName}' not found` };

  const { data: existing } = await supabaseAdmin
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badge.id)
    .maybeSingle();

  if (existing) return { success: true, message: `User already has ${badgeName}` };

  const payload = {
    user_id: userId,
    badge_id: badge.id,
    community_id: userProfile.community_id,
    earned_at: new Date().toISOString()
  };

  const { error: insertError } = await supabaseAdmin.from('user_badges').insert(payload);
  if (insertError) return { success: false, message: `DB Error: ${insertError.message}` };

  // 🎯 Award badge-specific XP (from badge.xp_reward)
  const xpToAward = badge.xp_reward ?? 0;
  if (xpToAward > 0) {
    try {
      await supabaseAdmin.rpc('increment_user_xp', { p_user_id: userId, p_xp_to_add: xpToAward });

      // Log to actions_log for analytics tracking
      await supabaseAdmin.from('actions_log').insert({
        user_id: userId,
        community_id: userProfile.community_id,
        action_type: 'badge_earned',
        xp_gained: xpToAward,
        source: 'badge'
      });

      console.log(`🏆 Badge awarded: ${badgeName} (+${xpToAward} XP)`);
    } catch (e) {
      console.warn("Failed to award badge XP:", e);
    }
  }

  revalidatePath('/dashboard');
  return { success: true, message: `Successfully awarded: ${badgeName}` };
}

export async function updateUserProfile(updates: any, targetId?: string) {
  const session = await verifyUser();
  if (!session || !session.userId) throw new Error("User not found");

  const idToUpdate = targetId || session.userId;
  if (idToUpdate !== session.userId && !session.isAdmin) throw new Error("Forbidden");

  const safeUpdates: any = {};
  if (updates.avatarUrl) safeUpdates.avatar_url = updates.avatarUrl;
  if (updates.username) safeUpdates.username = updates.username;
  if (updates.metadata) safeUpdates.metadata = updates.metadata;

  const { error } = await supabaseAdmin.from('profiles').update(safeUpdates).eq('id', idToUpdate);
  return !error;
}

export async function equipCosmeticAction(item: StoreItem) {
  const session = await verifyUser();
  if (!session || !session.userId) throw new Error("User not found");

  const { data: ownership } = await supabaseAdmin.from('user_inventory').select('id').eq('user_id', session.userId).eq('item_id', item.id).single();
  if (!ownership) return { success: false, message: "You do not own this item." };

  const { data: profile } = await supabaseAdmin.from('profiles').select('metadata').eq('id', session.userId).single();
  const currentMeta = profile?.metadata || {};

  if (item.itemType === 'NAME_COLOR') currentMeta.nameColor = item.metadata?.color;
  if (item.itemType === 'TITLE') {
    currentMeta.title = item.metadata?.text;
    currentMeta.titlePosition = item.metadata?.titlePosition || 'prefix';
  }
  if (item.itemType === 'BANNER') currentMeta.bannerUrl = item.metadata?.imageUrl;
  if (item.itemType === 'FRAME') currentMeta.frameColor = item.metadata?.color;
  if (item.itemType === 'AVATAR_PULSE') currentMeta.avatarPulseColor = item.metadata?.color;

  const { error } = await supabaseAdmin.from('profiles').update({ metadata: currentMeta }).eq('id', session.userId);
  if (error) return { success: false, message: error.message };
  return { success: true, message: "Equipped successfully!" };
}

export async function unequipCosmeticAction(type: string) {
  const session = await verifyUser();
  if (!session || !session.userId) throw new Error("User not found");

  const { data: profile } = await supabaseAdmin.from('profiles').select('metadata').eq('id', session.userId).single();
  const currentMeta = profile?.metadata || {};

  if (type === 'NAME_COLOR') delete currentMeta.nameColor;
  if (type === 'TITLE') { delete currentMeta.title; delete currentMeta.titlePosition; }
  if (type === 'BANNER') delete currentMeta.bannerUrl;
  if (type === 'FRAME') delete currentMeta.frameColor;
  if (type === 'AVATAR_PULSE') delete currentMeta.avatarPulseColor;

  const { error } = await supabaseAdmin.from('profiles').update({ metadata: currentMeta }).eq('id', session.userId);
  if (error) return { success: false, message: error.message };
  return { success: true, message: "Unequipped successfully!" };
}

export async function buyStoreItemAction(itemId: string) {
  const session = await verifyUser();
  if (!session || !session.userId) throw new Error("User not found");
  const { data, error } = await supabaseAdmin.rpc('buy_store_item', { p_user_id: session.userId, p_item_id: itemId });
  if (error) return { success: false, message: error.message };
  return data;
}

export async function activateInventoryItemAction(inventoryId: string) {
  const session = await verifyUser();
  if (!session || !session.userId) return { success: false, message: "User not found" };

  // Get the inventory item with its store item details
  const { data: invItem, error: invError } = await supabaseAdmin
    .from('user_inventory')
    .select('*, store_items(*)')
    .eq('id', inventoryId)
    .eq('user_id', session.userId)
    .single();

  if (invError || !invItem) {
    return { success: false, message: "You do not own this item." };
  }

  const itemType = invItem.store_items?.item_type;
  const metadata = invItem.store_items?.metadata || {};

  // Handle new consumable types directly
  if (itemType === 'STREAK_FREEZE') {
    // Add +1 streak freeze
    const { data: profile } = await supabaseAdmin.from('profiles').select('streak_freezes').eq('id', session.userId).single();
    const currentFreezes = profile?.streak_freezes || 0;
    await supabaseAdmin.from('profiles').update({ streak_freezes: currentFreezes + 1 }).eq('id', session.userId);
    // Remove from inventory
    await supabaseAdmin.from('user_inventory').delete().eq('id', inventoryId);
    return { success: true, message: "+1 Streak Freeze added!" };
  } else if (itemType === 'XP_GIFT') {
    // Add flat XP amount
    const xpAmount = metadata.xpAmount || 100;
    await supabaseAdmin.rpc('increment_user_xp', { p_user_id: session.userId, p_xp_to_add: xpAmount });
    // Remove from inventory
    await supabaseAdmin.from('user_inventory').delete().eq('id', inventoryId);
    return { success: true, message: `+${xpAmount} XP added!` };
  } else if (itemType === 'RANDOM_XP') {
    // Add random XP within range
    const xpMin = metadata.xpMin || 50;
    const xpMax = metadata.xpMax || 200;
    const randomXp = Math.floor(Math.random() * (xpMax - xpMin + 1)) + xpMin;
    await supabaseAdmin.rpc('increment_user_xp', { p_user_id: session.userId, p_xp_to_add: randomXp });
    // Remove from inventory
    await supabaseAdmin.from('user_inventory').delete().eq('id', inventoryId);
    return { success: true, message: `You received ${randomXp} XP!` };
  }

  // Default: call the original RPC for TIMED_EFFECT items
  const { data, error } = await supabaseAdmin.rpc('activate_inventory_item', { p_inventory_id: inventoryId });
  if (error) return { success: false, message: error.message };
  return data;
}

export async function claimQuestRewardAction(progressId: number) {
  const session = await verifyUser();
  if (!session || !session.userId) throw new Error("User not found");

  const { data: updatedProgress, error } = await supabaseAdmin
    .from('user_quest_progress')
    .update({ is_claimed: true })
    .eq('id', progressId)
    .eq('user_id', session.userId)
    .eq('is_completed', true)
    .eq('is_claimed', false)
    .select()
    .single();

  if (error || !updatedProgress) return { success: false, message: 'Error claiming reward.' };

  const { quest_id: questId } = updatedProgress;
  const { data: questData } = await supabaseAdmin.from('quests').select('xp_reward, badge_reward_id, community_id').eq('id', questId).single();

  if (!questData) return { success: false, message: "Quest data missing." };

  await supabaseAdmin.rpc('increment_user_xp', { p_user_id: session.userId, p_xp_to_add: questData.xp_reward });

  // 🎯 Log quest_completed to actions_log for analytics
  await supabaseAdmin.from('actions_log').insert({
    user_id: session.userId,
    community_id: questData.community_id,
    action_type: 'quest_completed',
    xp_gained: questData.xp_reward,
    source: 'quest'
  });
  console.log(`🎯 Quest completed: +${questData.xp_reward} XP`);

  if (questData.badge_reward_id) {
    const { data: userProfile } = await supabaseAdmin.from('profiles').select('community_id').eq('id', session.userId).single();

    const { count } = await supabaseAdmin.from('user_badges').select('id', { count: 'exact' }).eq('user_id', session.userId).eq('badge_id', questData.badge_reward_id);

    if (count === 0 && userProfile) {
      // Get badge xp_reward for analytics
      const { data: badge } = await supabaseAdmin.from('badges').select('xp_reward').eq('id', questData.badge_reward_id).single();
      const badgeXp = badge?.xp_reward ?? 0;

      await supabaseAdmin.from('user_badges').insert({
        user_id: session.userId,
        badge_id: questData.badge_reward_id,
        community_id: userProfile.community_id,
        earned_at: new Date().toISOString()
      });

      // Award badge XP and log to actions_log
      if (badgeXp > 0) {
        await supabaseAdmin.rpc('increment_user_xp', { p_user_id: session.userId, p_xp_to_add: badgeXp });
        await supabaseAdmin.from('actions_log').insert({
          user_id: session.userId,
          community_id: userProfile.community_id,
          action_type: 'badge_earned',
          xp_gained: badgeXp,
          source: 'quest'
        });
        console.log(`🏆 Quest badge earned: +${badgeXp} XP`);
      }
    }
  }
  return { success: true, message: `+${questData.xp_reward} XP!` };
}

export async function adminUpdateUserStatsAction(targetUserId: string, xp: number, streak: number, freezes: number) {
  await ensureAdmin();
  const { error } = await supabaseAdmin.from('profiles').update({ xp, streak, streak_freezes: freezes }).eq('id', targetUserId);
  return { success: !error };
}

export async function adminUpdateUserRoleAction(targetUserId: string, role: string) {
  const session = await verifyUser();
  if (!session || (!session.isAdmin && session.userId !== targetUserId)) throw new Error("Forbidden");
  const { error } = await supabaseAdmin.from('profiles').update({ role }).eq('id', targetUserId);
  return { success: !error };
}

export async function adminBanUserAction(targetUserId: string, durationHours: number | null) {
  await ensureAdmin();
  let banned_until: string | null = null;
  if (durationHours === 0) banned_until = new Date().toISOString();
  else if (durationHours) {
    const date = new Date();
    date.setHours(date.getHours() + durationHours);
    banned_until = date.toISOString();
  }
  const { error } = await supabaseAdmin.from('profiles').update({ banned_until }).eq('id', targetUserId);
  return { success: !error };
}

export async function adminUpdateCommunityTierAction(tier: any) {
  await ensureAdmin();
  const communityId = await getCommunityId();

  // Build update payload - always update tier
  const updatePayload: { subscription_tier: string; trial_ends_at?: null } = { subscription_tier: tier };

  // 🔧 FIX: Clear trial_ends_at when downgrading from trial
  // This prevents stale trial data from affecting feature gating
  if (tier !== 'trial') {
    updatePayload.trial_ends_at = null;
  }

  const { error } = await supabaseAdmin.from('communities').update(updatePayload).eq('id', communityId);
  return !error;
}

export async function adminCreateStoreItemAction(itemData: any) {
  await ensureAdmin();
  const communityId = await getCommunityId();

  const dbPayload = {
    community_id: communityId,
    name: itemData.name,
    description: itemData.description,
    cost_xp: itemData.cost,
    icon: itemData.icon,
    item_type: itemData.itemType,
    is_available: itemData.isActive,
    duration_hours: itemData.durationHours,
    modifier: itemData.modifier,
    metadata: itemData.metadata
  };

  const { error } = await supabaseAdmin.from('store_items').insert(dbPayload);
  return !error;
}

export async function adminUpdateStoreItemAction(itemId: string, itemData: any) {
  await ensureAdmin();
  const updates: any = {};
  if (itemData.name) updates.name = itemData.name;
  if (itemData.description) updates.description = itemData.description;
  if (itemData.cost) updates.cost_xp = itemData.cost;
  if (itemData.icon) updates.icon = itemData.icon;
  if (itemData.itemType) updates.item_type = itemData.itemType;
  if (itemData.isActive !== undefined) updates.is_available = itemData.isActive;
  if (itemData.durationHours !== undefined) updates.duration_hours = itemData.durationHours;
  if (itemData.modifier !== undefined) updates.modifier = itemData.modifier;
  if (itemData.metadata) updates.metadata = itemData.metadata;

  const { error } = await supabaseAdmin.from('store_items').update(updates).eq('id', itemId);
  return !error;
}

export async function adminDeleteStoreItemAction(itemId: string) {
  await ensureAdmin();
  const { error } = await supabaseAdmin.from('store_items').update({ is_archived: true, is_available: false }).eq('id', itemId);
  return { success: !error, message: error ? error.message : "Archived" };
}

export async function adminRestoreStoreItemAction(itemId: string) {
  await ensureAdmin();
  const { error } = await supabaseAdmin.from('store_items').update({ is_archived: false }).eq('id', itemId);
  return { success: !error, message: error ? error.message : "Restored" };
}

export async function adminToggleStoreItemAction(itemId: string, isActive: boolean) {
  await ensureAdmin();
  const { error } = await supabaseAdmin.from('store_items').update({ is_available: isActive }).eq('id', itemId);
  return !error;
}

export async function adminAddRewardAction(actionType: string, xp: number, displayName?: string) {
  await ensureAdmin();
  const communityId = await getCommunityId();
  const payload: any = {
    community_id: communityId,
    action_type: actionType,
    xp_gained: xp,
    display_name: displayName || actionType // Default to actionType if not provided
  };

  const { error } = await supabaseAdmin.from('reward_actions').insert(payload);
  return !error;
}

export async function adminUpdateRewardAction(currentActionType: string, data: any) {
  await ensureAdmin();
  const updates: any = {};
  if (data.xpGained !== undefined) updates.xp_gained = data.xpGained;
  if (data.isActive !== undefined) updates.is_active = data.isActive;
  if (data.displayName !== undefined) updates.display_name = data.displayName;
  if (data.actionType && data.actionType !== currentActionType) {
    updates.action_type = data.actionType;
  }

  const { error } = await supabaseAdmin
    .from('reward_actions')
    .update(updates)
    .eq('action_type', currentActionType);

  if (!error) revalidatePath('/admin');
  return !error;
}

export async function adminDeleteRewardAction(actionType: string, isArchive: boolean) {
  await ensureAdmin();
  if (isArchive) {
    const { error } = await supabaseAdmin.from('reward_actions').update({ is_archived: true }).eq('action_type', actionType);
    return { success: !error, message: error ? error.message : "Archived" };
  } else {
    const { error } = await supabaseAdmin.from('reward_actions').delete().eq('action_type', actionType);
    return { success: !error, message: error ? error.message : "Deleted" };
  }
}

export async function adminRestoreRewardAction(actionType: string) {
  await ensureAdmin();
  const { error } = await supabaseAdmin.from('reward_actions').update({ is_archived: false }).eq('action_type', actionType);
  return { success: !error, message: error ? error.message : "Restored" };
}

export async function adminAddBadgeAction(name: string, config: any) {
  await ensureAdmin();
  const communityId = await getCommunityId();
  const insertData: any = {
    community_id: communityId,
    name,
    description: config.description,
    icon: config.icon,
    color: config.color,
    xp_reward: config.xpReward ?? 0,
    trigger_type: config.triggerType ?? 'none',
    trigger_value: config.triggerValue ?? null,
    trigger_action: config.triggerAction ?? null
  };
  const { error } = await supabaseAdmin.from('badges').insert(insertData);
  return !error;
}

export async function adminUpdateBadgeAction(currentName: string, config: any) {
  await ensureAdmin();
  const communityId = await getCommunityId();
  const updates: any = {};
  if (config.description !== undefined) updates.description = config.description;
  if (config.icon !== undefined) updates.icon = config.icon;
  if (config.color !== undefined) updates.color = config.color;
  if (config.isActive !== undefined) updates.is_active = config.isActive;
  if (config.xpReward !== undefined) updates.xp_reward = config.xpReward;
  if (config.triggerType !== undefined) updates.trigger_type = config.triggerType;
  if (config.triggerValue !== undefined) updates.trigger_value = config.triggerValue;
  if (config.triggerAction !== undefined) updates.trigger_action = config.triggerAction || null;
  if (config.name && config.name !== currentName) {
    updates.name = config.name;
  }

  const { error } = await supabaseAdmin
    .from('badges')
    .update(updates)
    .eq('name', currentName)
    .eq('community_id', communityId);

  return !error;
}

export async function adminDeleteBadgeAction(name: string, isArchive: boolean) {
  await ensureAdmin();
  const communityId = await getCommunityId();
  const { data: badge } = await supabaseAdmin.from('badges').select('id').eq('name', name).eq('community_id', communityId).single();
  if (!badge) return { success: false, message: "Badge not found" };

  if (isArchive) {
    const { error } = await supabaseAdmin.from('badges').update({ is_archived: true }).eq('id', badge.id);
    return { success: !error, message: error ? error.message : "Archived" };
  } else {
    const { error } = await supabaseAdmin.from('badges').delete().eq('id', badge.id);
    return { success: !error, message: error ? error.message : "Deleted" };
  }
}

export async function adminRestoreBadgeAction(name: string) {
  await ensureAdmin();
  const communityId = await getCommunityId();
  const { error } = await supabaseAdmin.from('badges').update({ is_archived: false }).eq('name', name).eq('community_id', communityId);
  return { success: !error, message: error ? error.message : "Restored" };
}

export async function adminCreateQuestAction(questData: any) {
  await ensureAdmin();
  const communityId = await getCommunityId();
  let badgeId = questData.badgeRewardId;

  if (!badgeId && questData.badgeReward) {
    const { data: badge } = await supabaseAdmin.from('badges').select('id').eq('name', questData.badgeReward).eq('community_id', communityId).single();
    if (badge) badgeId = badge.id;
  }

  const { data: newQuest, error } = await supabaseAdmin.from('quests').insert({
    community_id: communityId,
    title: questData.title,
    description: questData.description,
    xp_reward: questData.xpReward,
    badge_reward_id: badgeId,
    is_active: true,
  }).select().single();

  if (error || !newQuest) return false;

  const tasksToInsert = (questData.tasks ?? []).map((task: any) => ({
    quest_id: newQuest.id,
    action_type: task.actionType,
    target_count: task.targetCount,
    description: task.description || "",
  }));

  await supabaseAdmin.from('quest_tasks').insert(tasksToInsert);
  return true;
}

export async function adminUpdateQuestAction(questId: string, questData: any) {
  await ensureAdmin();
  const { error: questError } = await supabaseAdmin.from('quests').update({
    title: questData.title,
    description: questData.description,
    xp_reward: questData.xpReward
  }).eq('id', questId);

  if (questError) {
    console.error("Error updating quest details:", questError);
    return false;
  }

  if (questData.tasks && Array.isArray(questData.tasks)) {
    const { error: deleteError } = await supabaseAdmin.from('quest_tasks').delete().eq('quest_id', questId);
    if (deleteError) return false;

    const tasksToInsert = questData.tasks.map((task: any) => ({
      quest_id: questId,
      action_type: task.actionType,
      target_count: task.targetCount,
      description: task.description || ""
    }));

    if (tasksToInsert.length > 0) {
      await supabaseAdmin.from('quest_tasks').insert(tasksToInsert);
    }
  }

  revalidatePath('/admin');
  revalidatePath('/quests');

  return true;
}

export async function adminDeleteQuestAction(questId: string) {
  await ensureAdmin();
  const { error } = await supabaseAdmin.from('quests').update({ is_archived: true, is_active: false }).eq('id', questId);
  return { success: !error, message: error ? error.message : "Archived" };
}

export async function adminRestoreQuestAction(questId: string) {
  await ensureAdmin();
  const { error } = await supabaseAdmin.from('quests').update({ is_archived: false }).eq('id', questId);
  return { success: !error, message: error ? error.message : "Restored" };
}

export async function adminToggleQuestAction(questId: string, isActive: boolean) {
  await ensureAdmin();
  const { error } = await supabaseAdmin.from('quests').update({ is_active: isActive }).eq('id', questId);
  return !error;
}

export async function recordActionServer(userId: string, actionType: ActionType, source: string) {
  // 🆕 First get the user's community_id to filter reward_actions correctly
  const { data: userProfile } = await supabaseAdmin.from('profiles').select('community_id').eq('id', userId).single();
  if (!userProfile?.community_id) {
    console.error(`recordActionServer: User ${userId} has no community_id`);
    return null;
  }

  // 🔧 FIX: Add community_id filter to avoid conflicts with multiple communities
  const { data: rewardData, error: rewardError } = await supabaseAdmin
    .from('reward_actions')
    .select('xp_gained')
    .eq('action_type', actionType)
    .eq('community_id', userProfile.community_id)
    .single();

  if (rewardError || !rewardData) {
    console.error(`recordActionServer: No reward action found for ${actionType} in community ${userProfile.community_id}`, rewardError);
    return null;
  }

  let xp_to_add = rewardData.xp_gained;

  const { data: activeEffects } = await supabaseAdmin.from('user_active_effects').select('modifier').eq('user_id', userId).eq('effect_type', 'XP_BOOST').gt('expires_at', new Date().toISOString());
  if (activeEffects && activeEffects.length > 0) xp_to_add = Math.round(xp_to_add * (activeEffects[0].modifier || 1));

  await supabaseAdmin.rpc('increment_user_xp', { p_user_id: userId, p_xp_to_add: xp_to_add });

  // 🆕 Update last_action_date and increment streak for daily_login
  if (actionType === 'daily_login') {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const { data: profile } = await supabaseAdmin.from('profiles').select('streak, last_action_date').eq('id', userId).single();

    const lastDate = profile?.last_action_date ? profile.last_action_date.split('T')[0] : null;
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Increment streak only if last action was yesterday, otherwise reset to 1
    const newStreak = lastDate === yesterday ? (profile?.streak || 0) + 1 : 1;

    await supabaseAdmin.from('profiles').update({
      last_action_date: new Date().toISOString(),
      streak: newStreak
    }).eq('id', userId);
  }

  // Log the action
  await supabaseAdmin.from('actions_log').insert({ user_id: userId, community_id: userProfile.community_id, action_type: actionType, xp_gained: xp_to_add, source: source });

  // 🆕 Update quest progress for any active quests that require this action
  try {
    // Find quest_tasks that match this action type
    const { data: matchingTasks } = await supabaseAdmin
      .from('quest_tasks')
      .select('id, quest_id, action_type, target_count, quests!inner(id, community_id, is_active, is_archived)')
      .eq('action_type', actionType)
      .eq('quests.community_id', userProfile.community_id)
      .eq('quests.is_active', true)
      .eq('quests.is_archived', false);

    if (matchingTasks && matchingTasks.length > 0) {
      for (const task of matchingTasks) {
        const questId = task.quest_id;

        // Get or create user's progress for this quest
        const { data: existingProgress } = await supabaseAdmin
          .from('user_quest_progress')
          .select('id, progress, is_completed')
          .eq('user_id', userId)
          .eq('quest_id', questId)
          .maybeSingle();

        if (existingProgress?.is_completed) {
          // Quest already completed, skip
          continue;
        }

        // Get all tasks for this quest to check completion
        const { data: allQuestTasks } = await supabaseAdmin
          .from('quest_tasks')
          .select('id, action_type, target_count')
          .eq('quest_id', questId);

        const currentProgress = existingProgress?.progress || {};
        // Use action_type as the key for progress tracking
        const taskKey = task.action_type;
        const newCount = (currentProgress[taskKey] || 0) + 1;
        const updatedProgress = { ...currentProgress, [taskKey]: newCount };

        // Check if all tasks are now complete
        let allComplete = true;
        if (allQuestTasks) {
          for (const qt of allQuestTasks) {
            const tk = qt.action_type;
            if ((updatedProgress[tk] || 0) < qt.target_count) {
              allComplete = false;
              break;
            }
          }
        }

        if (existingProgress) {
          // Update existing progress
          await supabaseAdmin
            .from('user_quest_progress')
            .update({
              progress: updatedProgress,
              is_completed: allComplete,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProgress.id);
        } else {
          // Create new progress entry
          await supabaseAdmin
            .from('user_quest_progress')
            .insert({
              user_id: userId,
              quest_id: questId,
              progress: updatedProgress,
              is_completed: allComplete,
              is_claimed: false
            });
        }

        console.log(`📋 Quest progress updated: ${questId} - ${actionType} (${newCount}/${task.target_count})`);
      }
    }
  } catch (questError) {
    console.error('Error updating quest progress:', questError);
    // Don't fail the action recording if quest progress fails
  }

  return { xpGained: xp_to_add };
}

export async function getAnalyticsDataServer(dateRange: '7d' | '30d'): Promise<AnalyticsData | null> {
  try {
    const session = await verifyUser();
    if (!session || !session.isAdmin || !session.communityId) return null;

    const communityId = session.communityId;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const dateLimit7d = new Date(new Date().setDate(now.getDate() - 7)).toISOString();
    const dateLimit14d = new Date(new Date().setDate(now.getDate() - 14)).toISOString();
    const dateLimit30d = new Date(new Date().setDate(now.getDate() - 30)).toISOString();

    const [
      profilesResult,
      actionsResult,
      userBadgesResult,
      questsResult,
      userQuestProgressResult,
      userPurchasesResult,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*').eq('community_id', communityId),
      supabaseAdmin.from('actions_log').select('*').eq('community_id', communityId).gte('created_at', dateLimit30d),
      supabaseAdmin.from('user_badges').select('badges!inner(name, icon, color)').eq('community_id', communityId),
      supabaseAdmin.from('quests').select('*').eq('community_id', communityId),
      supabaseAdmin.from('user_quest_progress').select('*'),
      supabaseAdmin.from('user_inventory').select('store_items!inner(name, cost_xp)').eq('community_id', communityId),
    ]);

    const allProfiles = profilesResult.data || [];
    const allActions = actionsResult.data || [];
    const allQuests = questsResult.data || [];
    const allUserPurchases = userPurchasesResult.data || [];
    const allUserQuestProgress = userQuestProgressResult.data || [];

    const totalUsers = allProfiles.length;
    if (totalUsers === 0) return null;

    const activeMembers7d = allProfiles.filter((p: any) => p.last_action_date && new Date(p.last_action_date).toISOString() >= dateLimit7d).length;
    const activeMembers30d = allProfiles.filter((p: any) => p.last_action_date && new Date(p.last_action_date).toISOString() >= dateLimit30d).length;

    const actionsToday = allActions.filter((a: any) => a.created_at && a.created_at >= todayStart);
    const xpEarnedToday = actionsToday.reduce((sum: number, a: any) => sum + (a.xp_gained || 0), 0);

    const newMembers7d = allProfiles.filter((p: any) => p.created_at && new Date(p.created_at).toISOString() >= dateLimit7d).length;
    const churnedMembers14d = allProfiles.filter((p: any) => !p.last_action_date || new Date(p.last_action_date).toISOString() < dateLimit14d).length;

    const mapUser = (p: any): Profile => ({
      id: p.id, username: p.username, avatarUrl: p.avatar_url, xp: p.xp, streak: p.streak,
      communityId: p.community_id, streakFreezes: p.streak_freezes, last_action_date: p.last_action_date, badges: [], role: p.role, level: 0, metadata: p.metadata
    });

    const topPerformers = {
      byXp: [...allProfiles].sort((a: any, b: any) => (Number(b.xp) || 0) - (Number(a.xp) || 0)).slice(0, 10).map(mapUser),
      byStreak: [...allProfiles].sort((a: any, b: any) => (Number(b.streak) || 0) - (Number(a.streak) || 0)).slice(0, 10).map(mapUser),
    };

    const actionCounts: Record<string, number> = {};
    for (const action of allActions) {
      const type = (action.action_type || 'unknown');
      actionCounts[type] = (actionCounts[type] || 0) + 1;
    }
    const activityBreakdown = Object.entries(actionCounts).map(([label, value]) => ({ label: label.replace(/_/g, ' '), value }));

    const totalStreaks = allProfiles.reduce((sum: number, p: any) => sum + (Number(p.streak) || 0), 0);
    const membersWithActiveStreak = allProfiles.filter((p: any) => p.streak > 0).length;

    const streakHealth = {
      avgStreakLength: membersWithActiveStreak > 0 ? Math.round(totalStreaks / membersWithActiveStreak) : 0,
      percentWithActiveStreak: Math.round((membersWithActiveStreak / totalUsers) * 100),
    };

    const xpByAction: Record<string, number> = {};
    for (const action of allActions) {
      const type = (action.action_type || 'unknown').replace(/_/g, ' ');
      xpByAction[type] = (xpByAction[type] || 0) + (action.xp_gained || 0);
    }
    const topXpActions = Object.entries(xpByAction).sort((a, b) => b[1] - a[1]).slice(0, 5)
      .map(([actionType, totalXp]) => ({ actionType: actionType as ActionType, totalXp }));

    const badgeCounts: Record<string, { name: string; icon: string; color: string; count: number }> = {};
    for (const userBadge of userBadgesResult.data || []) {
      const badge = userBadge.badges;
      const bData = Array.isArray(badge) ? badge[0] : badge;
      if (bData && bData.name) {
        if (!badgeCounts[bData.name]) badgeCounts[bData.name] = { name: bData.name, icon: bData.icon, color: bData.color, count: 0 };
        badgeCounts[bData.name].count += 1;
      }
    }
    const topBadges = Object.values(badgeCounts).sort((a, b) => b.count - a.count).slice(0, 6);

    const questAnalytics: any = allQuests.map((quest: any) => {
      const participants = allUserQuestProgress.filter((p: any) => p.quest_id === quest.id);
      const completers = participants.filter((p: any) => p.is_completed);
      return {
        questId: quest.id,
        title: quest.title,
        participationRate: totalUsers > 0 ? (participants.length / totalUsers) * 100 : 0,
        completionRate: participants.length > 0 ? (completers.length / participants.length) * 100 : 0,
      };
    }).sort((a: any, b: any) => b.participationRate - a.participationRate);

    const itemsCounter: Record<string, number> = {};
    for (const p of allUserPurchases) {
      const itemData = Array.isArray(p.store_items) ? p.store_items[0] : p.store_items;
      const iName = itemData?.name;
      if (iName) itemsCounter[iName] = (itemsCounter[iName] || 0) + 1;
    }

    const totalItems = Object.values(itemsCounter).reduce((sum, c) => sum + c, 0);
    const xpSpent = allUserPurchases.reduce((sum: number, p: any) => {
      const itemData = Array.isArray(p.store_items) ? p.store_items[0] : p.store_items;
      return sum + (Number(itemData?.cost_xp) || 0);
    }, 0);
    const mostPopularItem = Object.entries(itemsCounter).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "None";

    return {
      engagement: {
        activeMembers7d,
        activeMembers30d,
        avgDailyActions: actionsToday.length,
        xpEarnedToday
      },
      growth: { newMembers7d, churnedMembers14d },
      topPerformers, activityBreakdown, streakHealth, topXpActions, topBadges, questAnalytics,
      storeAnalytics: { totalItems, xpSpent, mostPopularItem, totalSpent: xpSpent, items: Object.entries(itemsCounter).map(([name, count]) => ({ name, count })) },
    };
  } catch (error: any) {
    console.error("Server Analytics Error:", error);
    return null;
  }
}