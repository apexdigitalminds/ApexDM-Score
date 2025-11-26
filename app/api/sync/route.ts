import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { api } from '@/services/api'; 

export async function POST(req: NextRequest) {
    try {
        // 1. Verify User
        const { userId } = await whopsdk.verifyUserToken(await headers());
        if (!userId) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });

        // 2. Fetch Completed Lessons
        // We use a try/catch here specifically for the SDK call to isolate Whop errors
        let interactions;
        try {
             interactions = await whopsdk.courseLessonInteractions.list({ 
                user_id: userId, 
                completed: true 
            });
        } catch (sdkError: any) {
            console.error("Whop SDK Error:", sdkError);
            return NextResponse.json({ success: false, message: `Whop API Error: ${sdkError.message}` }, { status: 500 });
        }

        // 3. Get local logs
        const existingActions = await api.getAllUserActions(userId);
        const processedCount = existingActions.filter(a => a.actionType === 'complete_module').length;
        
        let newXp = 0;
        let syncedCount = 0;
        
        // 4. Process Sync (Count-based to avoid ID mismatch issues)
        // We count how many Whop says you have vs how many we have logged.
        const whopCount = interactions?.data?.length || 0;
        const diff = whopCount - processedCount;

        if (diff > 0) {
            for (let i = 0; i < diff; i++) {
                // We simply record the action 'diff' times
                const result = await api.recordAction(userId, 'complete_module', 'whop'); 
                if (result) {
                    newXp += result.xpGained;
                    syncedCount++;
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: syncedCount > 0 ? `Synced ${syncedCount} new lessons. +${newXp} XP!` : "Up to date. No new lessons found." 
        });

    } catch (error: any) {
        console.error("Sync Route Critical Error:", error);
        // Return the ACTUAL error so we can see it in the toast
        return NextResponse.json({ success: false, message: `Sync Error: ${error.message || "Unknown"}` }, { status: 500 });
    }
}