/**
 * Cron Worker - Process Sync Queue
 * 
 * This endpoint is called by Vercel Cron every minute.
 * It processes pending sync jobs from the queue one at a time.
 * 
 * Security: Protected by CRON_SECRET environment variable
 */

import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { performSync } from '@/lib/sync-logic';

// Maximum jobs to process per cron run (Vercel has 10s/60s timeout)
const MAX_JOBS_PER_RUN = 2;

// Maximum time to spend processing (leave buffer for cleanup)
const MAX_PROCESSING_TIME_MS = 8000; // 8 seconds for safety

export async function GET(req: NextRequest) {
    const startTime = Date.now();

    // =========================================================================
    // 1. Verify Cron Authorization
    // =========================================================================
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // In development, allow without secret
    const isDev = process.env.NODE_ENV === 'development';

    if (!isDev && cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        console.error('❌ Cron unauthorized - invalid or missing CRON_SECRET');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('⏰ Cron worker starting - processing sync queue');

    // =========================================================================
    // 2. Clean Up Stale Jobs
    // =========================================================================
    // Mark jobs stuck in 'processing' for > 5 minutes as failed
    try {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

        const { data: staleJobs } = await supabaseAdmin
            .from('sync_queue')
            .update({
                status: 'failed',
                error_message: 'Timeout - job was stuck in processing',
                completed_at: new Date().toISOString()
            })
            .eq('status', 'processing')
            .lt('started_at', fiveMinutesAgo)
            .select('id');

        if (staleJobs && staleJobs.length > 0) {
            console.log(`🧹 Cleaned up ${staleJobs.length} stale job(s)`);
        }
    } catch (cleanupError: any) {
        console.warn('Cleanup warning:', cleanupError.message);
    }

    // =========================================================================
    // 3. Process Pending Jobs
    // =========================================================================
    let jobsProcessed = 0;
    const results: any[] = [];

    for (let i = 0; i < MAX_JOBS_PER_RUN; i++) {
        // Check if we have time remaining
        if (Date.now() - startTime > MAX_PROCESSING_TIME_MS) {
            console.log('⏱️ Time limit reached, stopping');
            break;
        }

        // Get oldest pending job
        const { data: job, error: fetchError } = await supabaseAdmin
            .from('sync_queue')
            .select(`
                id,
                user_id,
                community_id,
                profiles!inner(id, community_id, last_sync_at, whop_user_id)
            `)
            .eq('status', 'pending')
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();

        if (fetchError) {
            console.error('Failed to fetch job:', fetchError);
            break;
        }

        if (!job) {
            console.log('📭 No pending jobs in queue');
            break;
        }

        console.log(`📦 Processing job ${job.id} for user ${job.user_id}`);

        // Mark as processing
        await supabaseAdmin
            .from('sync_queue')
            .update({
                status: 'processing',
                started_at: new Date().toISOString()
            })
            .eq('id', job.id);

        try {
            // Get profile data
            const profile = job.profiles as any;

            if (!profile || !profile.whop_user_id) {
                throw new Error('Profile not found or missing whop_user_id');
            }

            // Perform the sync
            const result = await performSync(
                {
                    id: profile.id,
                    community_id: profile.community_id,
                    last_sync_at: profile.last_sync_at
                },
                profile.whop_user_id
            );

            // Mark as completed
            await supabaseAdmin
                .from('sync_queue')
                .update({
                    status: 'completed',
                    xp_gained: result.xpAwarded,
                    actions_synced: result.actionsCount,
                    completed_at: new Date().toISOString()
                })
                .eq('id', job.id);

            console.log(`✅ Job ${job.id} completed: +${result.xpAwarded} XP`);

            results.push({
                jobId: job.id,
                userId: job.user_id,
                xpAwarded: result.xpAwarded,
                actionsCount: result.actionsCount
            });

            jobsProcessed++;

        } catch (processError: any) {
            console.error(`❌ Job ${job.id} failed:`, processError.message);

            await supabaseAdmin
                .from('sync_queue')
                .update({
                    status: 'failed',
                    error_message: processError.message,
                    completed_at: new Date().toISOString()
                })
                .eq('id', job.id);

            results.push({
                jobId: job.id,
                userId: job.user_id,
                error: processError.message
            });
        }
    }

    // =========================================================================
    // 4. Report Results
    // =========================================================================
    const duration = Date.now() - startTime;

    console.log(`⏰ Cron completed: ${jobsProcessed} job(s) in ${duration}ms`);

    return NextResponse.json({
        success: true,
        jobsProcessed,
        duration: `${duration}ms`,
        results
    });
}

// Also support POST for manual triggering
export async function POST(req: NextRequest) {
    return GET(req);
}
