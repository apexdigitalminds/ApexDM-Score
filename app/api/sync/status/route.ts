/**
 * Sync Status API - Check user's sync queue status
 * 
 * Used by frontend to poll for sync completion after queuing.
 * Returns the status of the user's most recent sync job.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(req: NextRequest) {
    try {
        // =====================================================================
        // 1. Verify User
        // =====================================================================
        const payload = await whopsdk.verifyUserToken(await headers());
        const token = payload as any;
        const whopUserId = token.userId || token.user_id;
        const experienceId = token.experienceId || token.experience_id || '';

        if (!whopUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get profile
        let profile;

        if (experienceId) {
            const { data: community } = await supabaseAdmin
                .from('communities')
                .select('id')
                .eq('experience_id', experienceId)
                .maybeSingle();

            if (community) {
                const { data } = await supabaseAdmin
                    .from('profiles')
                    .select('id')
                    .eq('whop_user_id', whopUserId)
                    .eq('community_id', community.id)
                    .maybeSingle();
                profile = data;
            }
        }

        if (!profile) {
            const { data } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('whop_user_id', whopUserId)
                .limit(1)
                .maybeSingle();
            profile = data;
        }

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, { status: 404 });
        }

        // =====================================================================
        // 2. Get Latest Sync Job Status
        // =====================================================================
        const { data: job, error } = await supabaseAdmin
            .from('sync_queue')
            .select('id, status, xp_gained, actions_synced, error_message, created_at, completed_at')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error fetching sync status:', error);
            return NextResponse.json({ error: "Failed to check status" }, { status: 500 });
        }

        if (!job) {
            return NextResponse.json({
                status: 'none',
                message: 'No recent sync jobs'
            });
        }

        // =====================================================================
        // 3. Return Status
        // =====================================================================
        let message = '';
        switch (job.status) {
            case 'pending':
                message = 'Your sync is in queue. Processing shortly...';
                break;
            case 'processing':
                message = 'Syncing your activity now...';
                break;
            case 'completed':
                if (job.xp_gained && job.xp_gained > 0) {
                    message = `Sync complete! +${job.xp_gained} XP from ${job.actions_synced} action${job.actions_synced !== 1 ? 's' : ''}`;
                } else {
                    message = 'Sync complete. No new activity to reward.';
                }
                break;
            case 'failed':
                message = `Sync failed: ${job.error_message || 'Unknown error'}`;
                break;
        }

        return NextResponse.json({
            status: job.status,
            message,
            xpGained: job.xp_gained || 0,
            actionsSynced: job.actions_synced || 0,
            error: job.error_message,
            jobId: job.id,
            createdAt: job.created_at,
            completedAt: job.completed_at
        });

    } catch (error: any) {
        console.error('Sync status error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
