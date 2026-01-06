import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { recordActionServer } from '@/app/actions';
import type { ActionType } from '@/types';

export async function POST(req: NextRequest) {
    try {
        // 1. Verify User
        const { userId } = await whopsdk.verifyUserToken(await headers());
        if (!userId) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        let syncedCount = 0;
        let totalXp = 0;
        const syncResults: string[] = [];

        // =========================================================================
        // 2. Sync Course Progress (course_started, course_completed)
        // =========================================================================
        try {
            // Use courseLessonInteractions to check for course activity
            const interactions = await whopsdk.courseLessonInteractions.list({
                user_id: userId
            });
            const interactionsList = interactions?.data || [];

            if (interactionsList.length > 0) {
                // User has course interactions = they've started at least one course
                const startResult = await recordActionServer(userId, 'course_started' as ActionType, 'sync');
                if (startResult) {
                    syncedCount++;
                    totalXp += startResult.xpGained;
                    syncResults.push(`Course activity detected - XP awarded`);
                }

                // Check for completed lessons
                const completedLessons = interactionsList.filter((i: any) => i.completed);
                if (completedLessons.length > 0) {
                    syncResults.push(`${completedLessons.length} lessons completed`);
                }
            } else {
                syncResults.push("No course activity found");
            }
        } catch (sdkError: any) {
            console.warn("Course sync skipped:", sdkError.message);
            syncResults.push("Course sync: Requires course permissions");
        }

        // =========================================================================
        // 3. Sync Forum Posts (Award XP for posts)
        // =========================================================================
        try {
            const forumPosts = await whopsdk.forumPosts.list({
                user_id: userId
            });

            if (forumPosts && Array.isArray(forumPosts)) {
                const postCount = forumPosts.length;
                if (postCount > 0) {
                    // Award XP for forum participation (once per sync)
                    const result = await recordActionServer(userId, 'post_forum_comment' as ActionType, 'sync');
                    if (result) {
                        syncedCount++;
                        totalXp += result.xpGained;
                    }
                    syncResults.push(`Found ${postCount} forum posts - XP awarded`);
                } else {
                    syncResults.push("No forum posts found");
                }
            }
        } catch (sdkError: any) {
            console.warn("Forum sync skipped:", sdkError.message);
            syncResults.push("Forum sync: Requires forum:read permission");
        }

        // =========================================================================
        // 4. Sync Chat Messages (Award XP for chat activity)
        // =========================================================================
        try {
            const messages = await whopsdk.messages.list({
                user_id: userId
            });

            if (messages && Array.isArray(messages)) {
                const msgCount = messages.length;
                if (msgCount > 0) {
                    // Award XP for chat participation (once per sync)
                    const result = await recordActionServer(userId, 'post_chat_message' as ActionType, 'sync');
                    if (result) {
                        syncedCount++;
                        totalXp += result.xpGained;
                    }
                    syncResults.push(`Found ${msgCount} chat messages - XP awarded`);
                } else {
                    syncResults.push("No chat messages found");
                }
            }
        } catch (sdkError: any) {
            console.warn("Chat sync skipped:", sdkError.message);
            syncResults.push("Chat sync: Requires chat:read permission");
        }

        // =========================================================================
        // 5. Return Results
        // =========================================================================
        const message = syncedCount > 0
            ? `Synced! +${totalXp} XP (${syncedCount} actions)`
            : "Sync complete. No new activity to reward.";

        return NextResponse.json({
            success: true,
            message,
            details: syncResults,
            xpAwarded: totalXp,
            actionsCount: syncedCount
        });

    } catch (error: any) {
        console.error("Sync Critical Error:", error);
        return NextResponse.json({ success: false, message: `Sync Error: ${error.message}` }, { status: 500 });
    }
}