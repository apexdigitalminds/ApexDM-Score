import { waitUntil } from "@vercel/functions";
import type { Payment, Membership } from "@whop/sdk/resources"; 
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
// 🟢 FIX: Use the secure Admin client we created for Phase 6
import { supabaseAdmin } from "@/lib/supabase-admin"; 
// 🟢 FIX: Use the Server Action directly
import { recordActionServer } from "@/app/actions"; 

// 🔧 CONFIGURATION
const WHOP_CORE_PLAN_ID = "plan_core_placeholder"; 
const WHOP_PRO_PLAN_ID = "plan_pro_placeholder"; 
const WHOP_ELITE_PLAN_ID = "plan_elite_placeholder"; 
const TRIAL_DAYS = 30; 

export async function POST(request: NextRequest): Promise<Response> {
    const requestBodyText = await request.text();
    const headers = Object.fromEntries(request.headers);
    
    try {
        let webhookData;
        // Handle Local Dev vs Prod
        if (process.env.NODE_ENV === 'development') {
            try {
                webhookData = JSON.parse(requestBodyText);
            } catch (e) {
                // Fallback if it's a real hook sent to localhost via proxy
                webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
            }
        } else {
            // 🔒 PROD: Verify signature
            webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
        }

        // 1. Handle New Subscription
        if (webhookData.type === "membership.created") {
            waitUntil(handleMembershipCreated(webhookData.data));
        }
        
        // 2. Handle Payment (Renewals)
        if (webhookData.type === "payment.succeeded") {
             const payment = webhookData.data;
             console.log("💰 Payment received from Whop ID:", payment.user_id);

             // A. Resolve Whop ID to Internal ID using Admin Client
             const { data: userProfile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('whop_user_id', payment.user_id)
                .single();

             if (userProfile) {
                 // B. Award XP using Server Action
                 // Note: 'whop' is the source
                 await recordActionServer(
                    userProfile.id,       
                    "renew_subscription", 
                    "whop"                
                 );
                 console.log(`✅ XP Awarded to ${userProfile.id}`);
             } else {
                 console.warn(`⚠️ User ${payment.user_id} not found. Skipping XP.`);
             }
        }

        return new Response("OK", { status: 200 });
    } catch (error: any) {
        console.error("Webhook verification failed:", error.message);
        return new Response(`Error: ${error.message}`, { status: 400 });
    }
}

async function handleMembershipCreated(membership: Membership) {
    console.log("[MEMBERSHIP CREATED]", membership);

    let newTier = 'Free';
    let trialEnd = null; 

    // Check 'plan_id' first, fallback to 'experience'
    const planId = (membership as any).plan_id || (membership as any).experience;

    if (planId === WHOP_ELITE_PLAN_ID) {
        newTier = 'Elite';
    } else if (planId === WHOP_PRO_PLAN_ID) {
        newTier = 'Pro';
    } else if (planId === WHOP_CORE_PLAN_ID) {
        newTier = 'Core';
    } else {
        newTier = 'Free';
        const date = new Date();
        date.setDate(date.getDate() + TRIAL_DAYS);
        trialEnd = date.toISOString(); 
    }

    // Update Database using Admin Client
    // We blindly update the first community found (since this app is usually single-tenant per install)
    // In a multi-tenant app, you'd look up the community by the Whop Company ID
    const { error } = await supabaseAdmin
        .from('communities')
        .update({ 
            subscription_tier: newTier,
            trial_ends_at: trialEnd 
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all/any community row

    if (error) console.error("DB Update Failed:", error.message);
}