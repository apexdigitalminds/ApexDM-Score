/**
 * Sync Logic - Shared sync processing functions
 * 
 * This module contains the actual sync logic that fetches activity from Whop
 * and awards XP. It's used by both:
 * - Direct sync (immediate processing)
 * - Cron worker (queued processing)
 */

import { whopsdk } from '@/lib/whop-sdk';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { recordActionServer } from '@/app/actions';
import type { ActionType } from '@/types';

const MAX_ITEMS_PER_CHANNEL = 100;

export interface SyncResult {
    success: boolean;
    xpAwarded: number;
    actionsCount: number;
    details: string[];
    message: string;
    error?: string;
}

interface ProfileData {
    id: string;
    community_id: string;
    last_sync_at: string | null;
}

interface CommunityData {
    whop_store_id: string | null;
    whop_company_id: string | null;
    experience_id: string | null;
}

/**
 * Performs the actual sync work - fetches activity from Whop and awards XP
 * This is the core sync logic extracted for reuse
 */
export async function performSync(
    profile: ProfileData,
    whopUserId: string,
    experienceId: string = ''
): Promise<SyncResult> {
    console.log(`🔄 performSync starting for user ${profile.id}`);

    try {
        // Get community data
        const { data: community } = await supabaseAdmin
            .from('communities')
            .select('whop_store_id, whop_company_id, experience_id')
            .eq('id', profile.community_id)
            .single();

        const companyId = community?.whop_company_id || community?.whop_store_id || profile.community_id;
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

        const profileCreatedAt = new Date('2020-01-01');
        // For first sync, only look back 24 hours to avoid overwhelming data loads
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const sinceSyncDate = profile.last_sync_at ? new Date(profile.last_sync_at) : twentyFourHoursAgo;

        console.log('🔄 Sync with IDs:', { companyId, communityExperienceId, profileId: profile.id });

        let totalXp = 0;
        let syncedCount = 0;
        const syncResults: string[] = [];

        // =====================================================================
        // Discover Forum and Course Experiences
        // =====================================================================
        let forumExperienceIds: string[] = [];
        let courseExperienceIds: string[] = [];

        try {
            const experiences = await whopsdk.experiences.list({ company_id: companyId });
            for (const exp of experiences?.data || []) {
                const appName = (exp.app?.name || '').toLowerCase();
                const expName = (exp.name || '').toLowerCase();
                console.log(`  📦 Found experience: ${exp.name} (${exp.id}) - App: ${exp.app?.name}`);

                const isForumLike = ['forum', 'discussion', 'discussions'].some(
                    term => appName.includes(term) || expName.includes(term)
                );
                if (isForumLike) {
                    forumExperienceIds.push(exp.id);
                    console.log(`  ✅ Forum experience: ${exp.id} (matched: app="${exp.app?.name}", name="${exp.name}")`);
                }
                if (appName.includes('course')) {
                    courseExperienceIds.push(exp.id);
                    console.log(`  ✅ Course experience: ${exp.id}`);
                }
            }

            if (forumExperienceIds.length === 0) {
                console.warn(`  ⚠️ No forum experiences found for company ${companyId}. Forum sync will be skipped.`);
                console.warn(`  ⚠️ Available experiences: ${(experiences?.data || []).map(e => `${e.name} (${e.app?.name})`).join(', ') || 'none'}`);
            } else {
                console.log(`  📋 Will sync ${forumExperienceIds.length} forum experience(s): ${forumExperienceIds.join(', ')}`);
            }
        } catch (expError: any) {
            console.warn('Experience discovery skipped:', expError.message);
        }

        // =====================================================================
        // Sync Chat Messages
        // =====================================================================
        try {
            const channels = await whopsdk.chatChannels.list({ company_id: companyId });
            const channelList = channels?.data || [];
            let chatMessagesFound = 0;
            let chatMessagesRewarded = 0;

            for (const channel of channelList) {
                try {
                    const messages = await whopsdk.messages.list({
                        channel_id: channel.id,
                        first: MAX_ITEMS_PER_CHANNEL
                    });

                    for (const msg of messages?.data || []) {
                        if (msg.user?.id !== whopUserId) continue;

                        const msgDate = new Date(msg.created_at);
                        if (msgDate < profileCreatedAt) continue;
                        if (msgDate < sinceSyncDate) continue;

                        chatMessagesFound++;

                        const { data: existing } = await supabaseAdmin
                            .from('rewarded_activities')
                            .select('id')
                            .eq('profile_id', profile.id)
                            .eq('activity_type', 'chat_message')
                            .eq('external_id', msg.id)
                            .maybeSingle();

                        if (!existing) {
                            const result = await recordActionServer(profile.id, 'post_chat_message' as ActionType, 'sync');
                            if (result?.xpGained) {
                                totalXp += result.xpGained;
                                syncedCount++;
                                chatMessagesRewarded++;
                            }

                            await supabaseAdmin.from('rewarded_activities').insert({
                                profile_id: profile.id,
                                activity_type: 'chat_message',
                                external_id: msg.id
                            });
                        }
                    }
                } catch (channelError: any) {
                    console.warn(`Channel ${channel.id} skipped:`, channelError.message);
                }
            }

            if (chatMessagesRewarded > 0) {
                syncResults.push(`💬 ${chatMessagesRewarded} chat message${chatMessagesRewarded !== 1 ? 's' : ''}`);
            }
        } catch (chatError: any) {
            console.warn("Chat sync skipped:", chatError.message);
        }

        // =====================================================================
        // Sync Forum Posts (iterate ALL forum experiences)
        // =====================================================================
        try {
            if (forumExperienceIds.length > 0) {
                let forumPostsRewarded = 0;

                for (const forumExpId of forumExperienceIds) {
                    try {
                        console.log(`  🔍 Fetching forum posts from experience: ${forumExpId}`);
                        const posts = await whopsdk.forumPosts.list({
                            experience_id: forumExpId,
                            first: MAX_ITEMS_PER_CHANNEL
                        });

                        const allPosts = posts?.data || [];
                        console.log(`  📊 Forum ${forumExpId}: ${allPosts.length} total posts returned`);

                        let postsFromUser = 0;
                        let postsFilteredByDate = 0;
                        let postsAlreadyRewarded = 0;

                        for (const post of allPosts) {
                            // Log first few posts for debugging user ID format
                            if (postsFromUser === 0 && allPosts.indexOf(post) < 3) {
                                console.log(`  🔍 Sample post: user.id="${post.user?.id}" vs whopUserId="${whopUserId}" | created="${post.created_at}"`);
                            }

                            if (post.user?.id !== whopUserId) continue;
                            postsFromUser++;

                            const postDate = new Date(post.created_at);
                            if (postDate < profileCreatedAt) { postsFilteredByDate++; continue; }
                            if (postDate < sinceSyncDate) { postsFilteredByDate++; continue; }

                            const { data: existing } = await supabaseAdmin
                                .from('rewarded_activities')
                                .select('id')
                                .eq('profile_id', profile.id)
                                .eq('activity_type', 'forum_post')
                                .eq('external_id', post.id)
                                .maybeSingle();

                            if (existing) {
                                postsAlreadyRewarded++;
                                continue;
                            }

                            const result = await recordActionServer(profile.id, 'post_forum_comment' as ActionType, 'sync');
                            if (result?.xpGained) {
                                totalXp += result.xpGained;
                                syncedCount++;
                                forumPostsRewarded++;
                            } else {
                                console.warn(`  ⚠️ recordActionServer returned no XP for forum post ${post.id}`);
                            }

                            await supabaseAdmin.from('rewarded_activities').insert({
                                profile_id: profile.id,
                                activity_type: 'forum_post',
                                external_id: post.id
                            });
                        }

                        console.log(`  📊 Forum ${forumExpId} results: ${postsFromUser} from user, ${postsFilteredByDate} filtered by date, ${postsAlreadyRewarded} already rewarded`);
                    } catch (forumExpError: any) {
                        console.warn(`  ⚠️ Forum experience ${forumExpId} skipped:`, forumExpError.message);
                    }
                }

                if (forumPostsRewarded > 0) {
                    syncResults.push(`📝 ${forumPostsRewarded} forum post${forumPostsRewarded !== 1 ? 's' : ''}`);
                }
            }
        } catch (forumError: any) {
            console.warn("Forum sync skipped:", forumError.message);
        }

        // =====================================================================
        // Sync Course Progress
        // =====================================================================
        try {
            if (courseExperienceIds.length > 0) {
                let lessonsRewarded = 0;

                for (const courseExpId of courseExperienceIds) {
                    try {
                        const coursesResp = await whopsdk.courses.list({ experience_id: courseExpId });
                        const courses = coursesResp?.data || [];

                        for (const course of courses) {
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

                                    const { data: existing } = await supabaseAdmin
                                        .from('rewarded_activities')
                                        .select('id')
                                        .eq('profile_id', profile.id)
                                        .eq('activity_type', 'course_lesson')
                                        .eq('external_id', externalId)
                                        .maybeSingle();

                                    if (!existing) {
                                        const result = await recordActionServer(profile.id, 'lesson_completed' as ActionType, 'sync');
                                        if (result?.xpGained) {
                                            totalXp += result.xpGained;
                                            syncedCount++;
                                            lessonsRewarded++;
                                        }

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
                    } catch (courseListError: any) {
                        console.warn(`Course experience ${courseExpId} skipped:`, courseListError.message);
                    }
                }

                if (lessonsRewarded > 0) {
                    syncResults.push(`📚 ${lessonsRewarded} lesson${lessonsRewarded !== 1 ? 's' : ''} completed`);
                }
            }
        } catch (courseError: any) {
            console.warn("Course sync skipped:", courseError.message);
        }

        // =====================================================================
        // Update last_sync_at
        // =====================================================================
        await supabaseAdmin
            .from('profiles')
            .update({ last_sync_at: new Date().toISOString() })
            .eq('id', profile.id);

        // =====================================================================
        // Return Results
        // =====================================================================
        const message = syncedCount > 0
            ? `Synced! +${totalXp} XP from ${syncedCount} action${syncedCount !== 1 ? 's' : ''}`
            : "Sync complete. No new activity to reward.";

        console.log(`✅ performSync completed: ${totalXp} XP, ${syncedCount} actions`);

        return {
            success: true,
            message,
            details: syncResults.length > 0 ? syncResults : ["No new activity found"],
            xpAwarded: totalXp,
            actionsCount: syncedCount
        };

    } catch (error: any) {
        console.error("performSync Error:", error);
        return {
            success: false,
            message: `Sync Error: ${error.message}`,
            details: [],
            xpAwarded: 0,
            actionsCount: 0,
            error: error.message
        };
    }
}
