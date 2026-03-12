/**
 * Sync API Route - Hybrid Queue Implementation
 * 
 * SAFETY DESIGN:
 * - If no one is processing → sync immediately (current behavior)
 * - If someone is processing → add to queue (prevents API overload)
 * - On any queue check error → fallback to immediate sync
 * 
 * This ensures the sync always works, with queue as a safety net.
 */

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { whopsdk } from '@/lib/whop-sdk';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { performSync, type SyncResult } from '@/lib/sync-logic';

// 1 hour cooldown between syncs
const SYNC_COOLDOWN_MS = 60 * 60 * 1000;

// Feature flag - set to true when you upgrade to Vercel Pro (enables queue protection)
// On Hobby plan, crons are limited to daily, so queue processing won't work
const QUEUE_ENABLED = false;

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

        console.log(`🔑 Sync request: whopUserId=${whopUserId}, experienceId=${experienceId}`);

        // Get the user's profile - handle multi-tenant properly
        let profile;
        let profileError;

        if (experienceId) {
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

        // Fallback: try to find any profile by whop_user_id
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

        console.log(`👤 Sync profile found: id=${profile.id}, community=${profile.community_id}, last_sync_at=${profile.last_sync_at || 'never'}`);

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

        // =====================================================================
        // 3. HYBRID QUEUE LOGIC
        // =====================================================================

        // Check if we should use queue or immediate processing
        let useQueue = false;
        let queuePosition = 0;

        if (QUEUE_ENABLED) {
            try {
                // Check if anyone is currently processing a sync
                const { count: processingCount, error: countError } = await supabaseAdmin
                    .from('sync_queue')
                    .select('*', { count: 'exact', head: true })
                    .eq('status', 'processing');

                if (countError) {
                    console.warn('⚠️ Queue check failed, falling back to immediate sync:', countError.message);
                    // Fallback to immediate sync on error
                } else if (processingCount && processingCount > 0) {
                    console.log(`🔄 ${processingCount} sync(s) in progress - adding to queue`);
                    useQueue = true;

                    // Get queue position (pending jobs ahead of us + processing)
                    const { count: pendingCount } = await supabaseAdmin
                        .from('sync_queue')
                        .select('*', { count: 'exact', head: true })
                        .eq('status', 'pending');

                    queuePosition = (processingCount || 0) + (pendingCount || 0) + 1;
                } else {
                    console.log('✅ No sync in progress - processing immediately');
                }
            } catch (queueCheckError: any) {
                console.warn('⚠️ Queue check exception, falling back to immediate sync:', queueCheckError.message);
                // Fallback to immediate sync on any error
            }
        }

        // =====================================================================
        // 4A. QUEUED PATH - Add to queue for cron processing
        // =====================================================================
        if (useQueue) {
            try {
                // Check if user already has a pending job
                const { data: existingJob } = await supabaseAdmin
                    .from('sync_queue')
                    .select('id, status')
                    .eq('user_id', profile.id)
                    .eq('status', 'pending')
                    .maybeSingle();

                if (existingJob) {
                    return NextResponse.json({
                        success: true,
                        queued: true,
                        message: "Your sync is already in queue! Please wait.",
                        position: queuePosition
                    });
                }

                // Add to queue
                const { error: insertError } = await supabaseAdmin
                    .from('sync_queue')
                    .insert({
                        user_id: profile.id,
                        community_id: profile.community_id,
                        status: 'pending'
                    });

                if (insertError) {
                    console.error('Failed to add to queue, falling back to immediate:', insertError);
                    // Fallback to immediate sync
                } else {
                    console.log(`📥 Added sync job to queue for user ${profile.id}, position ${queuePosition}`);

                    return NextResponse.json({
                        success: true,
                        queued: true,
                        message: `Sync queued! Position #${queuePosition}. Processing shortly...`,
                        position: queuePosition,
                        estimatedWait: `~${queuePosition} minute${queuePosition !== 1 ? 's' : ''}`
                    });
                }
            } catch (queueError: any) {
                console.error('Queue insert failed, falling back to immediate:', queueError);
                // Fallback to immediate sync
            }
        }

        // =====================================================================
        // 4B. IMMEDIATE PATH - Process sync now
        // =====================================================================
        console.log(`🚀 Processing sync immediately for user ${profile.id}`);

        const result = await performSync(
            { id: profile.id, community_id: profile.community_id, last_sync_at: profile.last_sync_at },
            whopUserId,
            experienceId
        );

        return NextResponse.json({
            success: result.success,
            message: result.message,
            details: result.details,
            xpAwarded: result.xpAwarded,
            actionsCount: result.actionsCount,
            immediate: true  // Flag to indicate immediate processing
        });

    } catch (error: any) {
        console.error("Sync Critical Error:", error);
        return NextResponse.json({
            success: false,
            message: `Sync Error: ${error.message}`
        }, { status: 500 });
    }
}