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
        const { userId: whopUserId } = await whopsdk.verifyUserToken(await headers());
        if (!whopUserId) {
            return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
        }

        // Get the user's profile from our database
        const { data: profile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, community_id, created_at, last_sync_at')
            .eq('whop_user_id', whopUserId)
            .single();

        if (profileError || !profile) {
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

        // Get company ID for API calls
        const { data: community } = await supabaseAdmin
            .from('communities')
            .select('whop_store_id')
            .eq('id', profile.community_id)
            .single();

        const companyId = community?.whop_store_id || profile.community_id;
        const profileCreatedAt = new Date(profile.created_at);
        const sinceSyncDate = profile.last_sync_at ? new Date(profile.last_sync_at) : profileCreatedAt;

        let totalXp = 0;
        let syncedCount = 0;
        const syncResults: string[] = [];

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
                    const messages = await whopsdk.chatChannelMessages.list({
                        channel_id: channel.id,
                        per_page: MAX_ITEMS_PER_CHANNEL
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
        try {
            const posts = await whopsdk.forumPosts.list({ company_id: companyId });
            let forumPostsRewarded = 0;

            for (const post of posts?.data || []) {
                // Check if this post is from the current user
                if (post.user?.id !== whopUserId) continue;

                // Check if post was created after profile creation
                const postDate = new Date(post.created_at);
                if (postDate < profileCreatedAt) continue;
                if (postDate < sinceSyncDate) continue;

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
                    }

                    // Mark as rewarded
                    await supabaseAdmin.from('rewarded_activities').insert({
                        profile_id: profile.id,
                        activity_type: 'forum_post',
                        external_id: post.id
                    });
                }
            }

            if (forumPostsRewarded > 0) {
                syncResults.push(`📝 ${forumPostsRewarded} forum post${forumPostsRewarded !== 1 ? 's' : ''}`);
            }
        } catch (forumError: any) {
            console.warn("Forum sync skipped:", forumError.message);
            syncResults.push("Forum: Requires forum permissions");
        }

        // =====================================================================
        // 5. Sync Course Lesson Interactions
        // =====================================================================
        try {
            const interactions = await whopsdk.courseLessonInteractions.list({
                user_id: whopUserId
            });
            let lessonsRewarded = 0;

            for (const interaction of interactions?.data || []) {
                if (!interaction.completed) continue;

                const interactionDate = new Date(interaction.completed_at || interaction.created_at);
                if (interactionDate < profileCreatedAt) continue;
                if (interactionDate < sinceSyncDate) continue;

                const externalId = interaction.lesson_id || interaction.id;

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

            if (lessonsRewarded > 0) {
                syncResults.push(`📚 ${lessonsRewarded} lesson${lessonsRewarded !== 1 ? 's' : ''} completed`);
            }
        } catch (courseError: any) {
            console.warn("Course sync skipped:", courseError.message);
            syncResults.push("Courses: Requires course permissions");
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