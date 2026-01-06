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
        // 2. Sync Course Progress (course_started)
        // =========================================================================
        try {
            const interactions = await whopsdk.courseLessonInteractions.list({
                user_id: userId
            });
            const interactionsList = interactions?.data || [];

            if (interactionsList.length > 0) {
                const startResult = await recordActionServer(userId, 'course_started' as ActionType, 'sync');
                if (startResult) {
                    syncedCount++;
                    totalXp += startResult.xpGained;
                    syncResults.push(`Course activity detected - XP awarded`);
                }

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
        // 3. Forum & Chat (Future: via webhooks/SSE)
        // =========================================================================
        syncResults.push("Forum/Chat: Available via future webhook integration");

        // =========================================================================
        // 4. Return Results
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