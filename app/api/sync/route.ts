import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { api } from '@/services/api'; 

export async function POST(req: NextRequest) {
    try {
        // 1. Verify User
        const { userId } = await whopsdk.verifyUserToken(await headers());
        if (!userId) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        // 2. Fetch Completed Lessons from Whop
        const interactions = await whopsdk.courseLessonInteractions.list({ 
            user_id: userId, 
            completed: true 
        });

        // 3. Get our local logs to check for duplicates
        // We assume that for 'complete_module', the source field contains the Lesson ID to prevent duplicates
        const existingActions = await api.getAllUserActions(userId);
        const processedLessonIds = new Set(
            existingActions
                .filter(a => a.actionType === 'complete_module')
                .map(a => a.source) // In our logic, source = lessonId for these actions? 
                // Wait, usually source is 'whop' or 'manual'. 
                // If we want to deduplicate by lesson ID, we might need to check a different field or rely on the fact 
                // that we can't easily store the lesson ID in the 'source' field if 'source' is restricted to an enum.
        );
        
        // REVISION: If 'source' must be 'whop' | 'manual', we can't store the lesson ID there.
        // We might need to skip strict deduplication based on lesson ID for now OR 
        // update 'recordAction' to accept an optional 'metadata' or 'referenceId' param.
        // 
        // FOR NOW: We will just check if the user has *enough* complete_module actions compared to Whop.
        // This is imperfect but fits the current strict type constraint.
        
        let newXp = 0;
        let syncedCount = 0;

        // Since we can't easily check *which* specific lesson was completed without a metadata column,
        // we will just ensure the total count matches.
        const whopCount = interactions.data.length;
        const localCount = existingActions.filter(a => a.actionType === 'complete_module').length;
        const diff = whopCount - localCount;

        if (diff > 0) {
            // Award XP for the difference
            for (let i = 0; i < diff; i++) {
                // 🟢 FIX: Use 'whop' as source
                const result = await api.recordAction(userId, 'complete_module', 'whop'); 
                if (result) {
                    newXp += result.xpGained;
                    syncedCount++;
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: syncedCount > 0 ? `Synced ${syncedCount} new lessons. +${newXp} XP!` : "You are up to date." 
        });

    } catch (error: any) {
        console.error("Sync Error:", error);
        return NextResponse.json({ success: false, message: "Sync failed." }, { status: 500 });
    }
}