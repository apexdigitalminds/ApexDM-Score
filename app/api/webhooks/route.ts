import { waitUntil } from "@vercel/functions";
import type { Payment, Membership } from "@whop/sdk/resources"; 
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { supabaseServer } from "@/lib/supabaseServer";
import { api } from "@/services/api";

// 🔧 CONFIGURATION
const WHOP_CORE_PLAN_ID = "plan_core_placeholder"; 
const WHOP_PRO_PLAN_ID = "plan_pro_placeholder"; 
const WHOP_ELITE_PLAN_ID = "plan_elite_placeholder"; 
const TRIAL_DAYS = 30; 

// ... imports ...

export async function POST(request: NextRequest): Promise<Response> {
    const requestBodyText = await request.text();
    const headers = Object.fromEntries(request.headers);
    
    try {
        let webhookData;
        if (process.env.NODE_ENV === 'development') {
            webhookData = JSON.parse(requestBodyText);
        } else {
            webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
        }

        // 1. Handle New Subscription
        if (webhookData.type === "membership.created") {
            waitUntil(handleMembershipCreated(webhookData.data));
        }
        
        // 2. Handle Payment (Renewals) - FIXED LOGIC
        if (webhookData.type === "payment.succeeded") {
             const payment = webhookData.data;
             console.log("💰 Payment received from Whop ID:", payment.user_id);

             // A. Resolve Whop ID to Internal ID
             const { data: userProfile } = await supabaseServer
                .from('profiles')
                .select('id')
                .eq('whop_user_id', payment.user_id)
                .single();

             if (userProfile) {
                 // B. Award XP
                 await api.recordAction(
                    userProfile.id,       // Internal UUID
                    "renew_subscription", // Action Key
                    "whop"                // Source
                 );
                 console.log(`✅ XP Awarded to ${userProfile.id}`);
             } else {
                 console.warn(`⚠️ User ${payment.user_id} not found in profiles. Skipping XP.`);
             }
        }

        return new Response("OK", { status: 200 });
    } catch (error) {
        console.error("Webhook verification failed:", error);
        return new Response("Error", { status: 400 });
    }
}

// ... existing handleMembershipCreated ...

async function handleMembershipCreated(membership: Membership) {
    console.log("[MEMBERSHIP CREATED]", membership);

    let newTier = 'Free';
    let trialEnd = null; // Default to clearing the trial

    // FIX: Check 'plan_id' first, fallback to 'experience'
    const planId = (membership as any).plan_id || (membership as any).experience;

    if (planId === WHOP_ELITE_PLAN_ID) {
        newTier = 'Elite';
        console.log("💎 User upgraded to ELITE");
    } 
    else if (planId === WHOP_PRO_PLAN_ID) {
        newTier = 'Pro';
        console.log("✨ User upgraded to PRO");
    } 
    else if (planId === WHOP_CORE_PLAN_ID) {
        newTier = 'Core';
        console.log("⭐ User upgraded to CORE");
    } 
    else {
        // Free / Trial logic
        newTier = 'Free';
        const date = new Date();
        date.setDate(date.getDate() + TRIAL_DAYS);
        trialEnd = date.toISOString(); // Set future date
        console.log(`🎁 Starting ${TRIAL_DAYS}-day Free Trial`);
    }

    // Update Database
    const { error } = await supabaseServer
        .from('communities')
        .update({ 
            subscription_tier: newTier,
            trial_ends_at: trialEnd // FIX: This will set it to NULL for paid plans
        })
        // In production use: .eq('whop_id', membership.user_id)
        .neq('id', '00000000-0000-0000-0000-000000000000'); 

    if (error) console.error("DB Update Failed:", error.message);
}