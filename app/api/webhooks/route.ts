import { waitUntil } from "@vercel/functions";
import type { Membership } from "@whop/sdk/resources"; 
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { supabaseAdmin } from "@/lib/supabase-admin"; 
import { recordActionServer, ensureWhopContext } from "@/app/actions"; 

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
                webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
            }
        } else {
            // 🔒 PROD: Verify signature
            webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
        }

        // 🟢 1. Handle New Subscription / App Install
        // This is the CRITICAL "Handshake" event.
        if (webhookData.type === "membership.created") {
            const membership = webhookData.data;
            
            // Whop Webhooks include 'company_id' at the root level of the payload wrapper
            const companyId = webhookData.company_id; 
            const userId = membership.user_id;

            if (companyId && userId) {
                // 🚀 RUN PROVISIONING
                // This ensures the DB row exists for THIS company and THIS user is an admin.
                console.log(`🚀 Provisioning triggered for Company: ${companyId}`);
                waitUntil(ensureWhopContext(companyId, userId));
            } else {
                console.warn("⚠️ membership.created received but missing company_id or user_id");
            }
            
            // Continue with standard membership tier handling
            waitUntil(handleMembershipCreated(membership));
        }
        
        // 2. Handle Payment (Renewals -> XP Award)
        if (webhookData.type === "payment.succeeded") {
             const payment = webhookData.data;
             console.log("💰 Payment received from Whop ID:", payment.user_id);

             // Resolve Whop ID to Internal ID
             const { data: userProfile } = await supabaseAdmin
                .from('profiles')
                .select('id')
                .eq('whop_user_id', payment.user_id)
                .single();

             if (userProfile) {
                 await recordActionServer(userProfile.id, "renew_subscription", "whop");
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

    // Note: This generic update targets the placeholder. 
    // In a true multi-tenant setup, 'ensureWhopContext' handles the specific community row creation.
    // This function acts as a fallback for the legacy 'Apex Traders' row if it exists.
    const { error } = await supabaseAdmin
        .from('communities')
        .update({ 
            subscription_tier: newTier,
            trial_ends_at: trialEnd 
        })
        .eq('whop_store_id', 'plan_core_placeholder'); // Safe default or update logic here if needed

    if (error) console.log("Standard Tier Update skipped or failed (Expected if using specific Store IDs)");
}