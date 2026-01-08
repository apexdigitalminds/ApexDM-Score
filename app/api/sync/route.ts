import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { recordActionServer } from '@/app/actions';
import type { ActionType } from '@/types';

// 1 hour cooldown between syncs
const SYNC_COOLDOWN_MS = 60 * 60 * 1000;
const MAX_ITEMS_PER_CHANNEL = 100;

export async function POST(req: NextRequest) {
    try {
        // =====================================================================
        // 1. Verify User & Get Profile
        // =====================================================================
        const payload = await whopsdk.verifyUserToken(await headers());
        const token = payload as any;
        const whopUserId = token.userId || token.user_id;
        const experienceId = token.experienceId || token.experience_id || '';

        if (!whopUserId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        // Get the user's profile from our database
        // For multi-tenant apps, a user may have profiles in multiple communities
        // First try to find by experience_id if available
        let profile;
        let profileError;

        if (experienceId) {
            // Get the community for this experience
            const { data: community } = await supabaseAdmin
                .from('communities')
                .select('id')
                .eq('experience_id', experienceId)
                .maybeSingle();

            if (community) {
                const result = await supabaseAdmin
                    .from('profiles')
                    .select('id, community_id, updated_at, last_sync_at')
                    .eq('whop_user_id', whopUserId)
                    .eq('community_id', community.id)
                    .maybeSingle();
                profile = result.data;
                profileError = result.error;
            }
        }

        // Fallback: try to find any profile by whop_user_id (for backwards compat)
        if (!profile) {
            const result = await supabaseAdmin
                .from('profiles')
                .select('id, community_id, updated_at, last_sync_at')
                .eq('whop_user_id', whopUserId)
                .limit(1)
                .maybeSingle();
            profile = result.data;
            profileError = result.error;
        }

        if (profileError || !profile) {
            console.error("Sync profile lookup failed:", { whopUserId, experienceId, profileError });
            return NextResponse.json({
                success: false,
                message: "Profile not found. Please refresh the app."
            }, { status: 404 });
        }

        // =====================================================================
        // 2. Check Cooldown
        // =====================================================================
        if (profile.last_sync_at) {
            const lastSync = new Date(profile.last_sync_at).getTime();
            const now = Date.now();
            const timeSinceLastSync = now - lastSync;

            if (timeSinceLastSync < SYNC_COOLDOWN_MS) {
                const remainingMs = SYNC_COOLDOWN_MS - timeSinceLastSync;
                const remainingMins = Math.ceil(remainingMs / 60000);
                return NextResponse.json({
                    success: false,
                    cooldown: true,
                    minutesRemaining: remainingMins,
                    message: `Sync available in ${remainingMins} minute${remainingMins !== 1 ? 's' : ''}`
                });
            }
        }

        // Get company ID and experience ID for API calls
        const { data: community } = await supabaseAdmin
            .from('communities')
            .select('whop_store_id, whop_company_id, experience_id')
            .eq('id', profile.community_id)
            .single();

        // Use whop_company_id for API calls (format: biz_xxxx), with fallbacks
        const companyId = community?.whop_company_id || community?.whop_store_id || profile.community_id;

        // Use experience_id from DB if available, otherwise from token
        let communityExperienceId = community?.experience_id || experienceId || '';

        // Auto-save experience_id if we have it from token but not in DB
        if (experienceId && !community?.experience_id) {
            console.log(`💾 Saving experience_id ${experienceId} to community ${profile.community_id}`);
            await supabaseAdmin
                .from('communities')
                .update({ experience_id: experienceId })
                .eq('id', profile.community_id);
            communityExperienceId = experienceId;
        }

        const profileCreatedAt = new Date(profile.updated_at || Date.now());
        const sinceSyncDate = profile.last_sync_at ? new Date(profile.last_sync_at) : profileCreatedAt;

        // Debug logging
        console.log('🔄 Sync starting with IDs:', {
            companyId,
            communityExperienceId,
            experienceIdFromToken: experienceId,
            profileId: profile.id,
            communityData: community
        });

        let totalXp = 0;
        let syncedCount = 0;
        const syncResults: string[] = [];

        // =====================================================================
        // 2.5 Discover Forum and Course Experiences
        // =====================================================================
        let forumExperienceId = '';
        let courseExperienceIds: string[] = [];

        try {
            const experiences = await whopsdk.experiences.list({ company_id: companyId });
            for (const exp of experiences?.data || []) {
                const appName = (exp.app?.name || '').toLowerCase();
                console.log(`  📦 Found experience: ${exp.name} (${exp.id}) - App: ${exp.app?.name}`);

                if (appName.includes('forum')) {
                    forumExperienceId = exp.id;
                    console.log(`  ✅ Forum experience: ${exp.id}`);
                }
                if (appName.includes('course')) {
                    courseExperienceIds.push(exp.id);
                    console.log(`  ✅ Course experience: ${exp.id}`);
                }
            }
        } catch (expError: any) {
            console.warn('Experience discovery skipped:', expError.message);
        }

        // =====================================================================
        // 3. Sync Chat Messages
        // =====================================================================
        try {
            const channels = await whopsdk.chatChannels.list({ company_id: companyId });
            const channelList = channels?.data || [];
            let chatMessagesFound = 0;
            let chatMessagesRewarded = 0;

            for (const channel of channelList) {
                try {
                    // Use whopsdk.messages.list per Whop SDK docs
                    const messages = await whopsdk.messages.list({
                        channel_id: channel.id,
                        first: MAX_ITEMS_PER_CHANNEL
                    });

                    for (const msg of messages?.data || []) {
                        // Check if this message is from the current user
                        if (msg.user?.id !== whopUserId) continue;

                        // Check if message was created after profile creation
                        const msgDate = new Date(msg.created_at);
                        if (msgDate < profileCreatedAt) continue;

                        // Check if message was created after last sync (for efficiency)
                        if (msgDate < sinceSyncDate) continue;

                        chatMessagesFound++;

                        // Check if already rewarded
                        const { data: existing } = await supabaseAdmin
                            .from('rewarded_activities')
                            .select('id')
                            .eq('profile_id', profile.id)
                            .eq('activity_type', 'chat_message')
                            .eq('external_id', msg.id)
                            .maybeSingle();

                        if (!existing) {
                            // Award XP
                            const result = await recordActionServer(profile.id, 'post_chat_message' as ActionType, 'sync');
                            if (result) {
                                totalXp += result.xpGained;
                                syncedCount++;
                                chatMessagesRewarded++;
                            }

                            // Mark as rewarded
                            await supabaseAdmin.from('rewarded_activities').insert({
                                profile_id: profile.id,
                                activity_type: 'chat_message',
                                external_id: msg.id
                            });
                        }
                    }
                } catch (channelError: any) {
                    console.warn(`Chat sync skipped for channel ${channel.id}:`, channelError.message);
                }
            }

            if (chatMessagesRewarded > 0) {
                syncResults.push(`💬 ${chatMessagesRewarded} chat message${chatMessagesRewarded !== 1 ? 's' : ''}`);
            }
        } catch (chatError: any) {
            console.warn("Chat sync skipped:", chatError.message);
            syncResults.push("Chat: Requires chat permissions");
        }

        // =====================================================================
        // 4. Sync Forum Posts
        // =====================================================================
        if (forumExperienceId) {
            try {
                // Use dynamically discovered forum experience ID
                console.log(`📝 Fetching forum posts for experience: ${forumExperienceId}`);
                const posts = await whopsdk.forumPosts.list({ experience_id: forumExperienceId });
                const postList = posts?.data || [];
                console.log(`📝 Found ${postList.length} total forum posts`);

                let forumPostsRewarded = 0;
                let postsChecked = 0;

                for (const post of postList) {
                    postsChecked++;

                    // Check if this post is from the current user
                    if (post.user?.id !== whopUserId) {
                        console.log(`   Post ${post.id}: skipped (user ${post.user?.id} != ${whopUserId})`);
                        continue;
                    }

                    // Check if post was created after profile creation
                    const postDate = new Date(post.created_at);
                    if (postDate < profileCreatedAt) {
                        console.log(`   Post ${post.id}: skipped (before profile created)`);
                        continue;
                    }
                    if (postDate < sinceSyncDate) {
                        console.log(`   Post ${post.id}: skipped (before last sync)`);
                        continue;
                    }

                    console.log(`   Post ${post.id}: eligible for XP (created ${post.created_at})`);

                    // Check if already rewarded
                    const { data: existing } = await supabaseAdmin
                        .from('rewarded_activities')
                        .select('id')
                        .eq('profile_id', profile.id)
                        .eq('activity_type', 'forum_post')
                        .eq('external_id', post.id)
                        .maybeSingle();

                    if (!existing) {
                        // Award XP for forum post
                        const result = await recordActionServer(profile.id, 'post_forum_comment' as ActionType, 'sync');
                        if (result) {
                            totalXp += result.xpGained;
                            syncedCount++;
                            forumPostsRewarded++;
                            console.log(`   Post ${post.id}: ✅ Rewarded +${result.xpGained} XP`);
                        }

                        // Mark as rewarded
                        await supabaseAdmin.from('rewarded_activities').insert({
                            profile_id: profile.id,
                            activity_type: 'forum_post',
                            external_id: post.id
                        });
                    } else {
                        console.log(`   Post ${post.id}: already rewarded`);
                    }
                }

                console.log(`📝 Forum sync complete: ${postsChecked} checked, ${forumPostsRewarded} rewarded`);

                if (forumPostsRewarded > 0) {
                    syncResults.push(`📝 ${forumPostsRewarded} forum post${forumPostsRewarded !== 1 ? 's' : ''}`);
                }
            } catch (forumError: any) {
                console.warn("Forum sync skipped:", forumError.message);
            }
        } else {
            console.log('📝 No forum experience found - skipping forum sync');
        }

        // =====================================================================
        // 5. Sync Course Lesson Interactions
        // =====================================================================
        try {
            let lessonsRewarded = 0;
            let totalCoursesChecked = 0;

            // Use discovered course experience IDs, or fall back to listing by company
            if (courseExperienceIds.length > 0) {
                // Fetch courses from each course experience
                for (const courseExpId of courseExperienceIds) {
                    const coursesResult = await whopsdk.courses.list({ experience_id: courseExpId });
                    const courseList = coursesResult?.data || [];
                    totalCoursesChecked += courseList.length;

                    for (const course of courseList) {
                        try {
                            const interactions = await whopsdk.courseLessonInteractions.list({
                                course_id: course.id,
                                user_id: whopUserId
                            });

                            for (const interaction of interactions?.data || []) {
                                if (!interaction.completed) continue;

                                const interactionDate = new Date(interaction.created_at);
                                if (interactionDate < profileCreatedAt) continue;
                                if (interactionDate < sinceSyncDate) continue;

                                const externalId = interaction.lesson?.id || interaction.id;

                                // Check if already rewarded
                                const { data: existing } = await supabaseAdmin
                                    .from('rewarded_activities')
                                    .select('id')
                                    .eq('profile_id', profile.id)
                                    .eq('activity_type', 'course_lesson')
                                    .eq('external_id', externalId)
                                    .maybeSingle();

                                if (!existing) {
                                    // Award XP for lesson completion
                                    const result = await recordActionServer(profile.id, 'lesson_completed' as ActionType, 'sync');
                                    if (result) {
                                        totalXp += result.xpGained;
                                        syncedCount++;
                                        lessonsRewarded++;
                                    }

                                    // Mark as rewarded
                                    await supabaseAdmin.from('rewarded_activities').insert({
                                        profile_id: profile.id,
                                        activity_type: 'course_lesson',
                                        external_id: externalId
                                    });
                                }
                            }
                        } catch (courseInteractionError: any) {
                            console.warn(`Course ${course.id} interactions skipped:`, courseInteractionError.message);
                        }
                    }
                }
            } else {
                console.log('📚 No course experiences found - skipping course sync');
            }

            console.log(`📚 Found ${totalCoursesChecked} courses to check`);

            if (lessonsRewarded > 0) {
                syncResults.push(`📚 ${lessonsRewarded} lesson${lessonsRewarded !== 1 ? 's' : ''} completed`);
            }
        } catch (courseError: any) {
            console.warn("Course sync skipped:", courseError.message);
        }

        // =====================================================================
        // 6. Update last_sync_at
        // =====================================================================
        await supabaseAdmin
            .from('profiles')
            .update({ last_sync_at: new Date().toISOString() })
            .eq('id', profile.id);

        // =====================================================================
        // 7. Return Results
        // =====================================================================
        const message = syncedCount > 0
            ? `Synced! +${totalXp} XP from ${syncedCount} action${syncedCount !== 1 ? 's' : ''}`
            : "Sync complete. No new activity to reward.";

        return NextResponse.json({
            success: true,
            message,
            details: syncResults.length > 0 ? syncResults : ["No new activity found"],
            xpAwarded: totalXp,
            actionsCount: syncedCount
        });

    } catch (error: any) {
        console.error("Sync Critical Error:", error);
        return NextResponse.json({
            success: false,
            message: `Sync Error: ${error.message}`
        }, { status: 500 });
    }
}