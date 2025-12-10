import { waitUntil } from "@vercel/functions";
import type { Payment, Membership } from "@whop/sdk/resources"; 
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
        if (webhookData.type === "membership.created") {
            const membership = webhookData.data;
            
            // Extract company_id from root payload or membership data
            const companyId = webhookData.company_id || (membership as any).company_id || (membership as any).store_id;
            const userId = membership.user_id;

            if (companyId && userId) {
                console.log(`🚀 Provisioning triggered for Company: ${companyId}, User: ${userId}`);
                waitUntil(ensureWhopContext(companyId, userId));
            } else {
                console.warn("⚠️ membership.created received but missing IDs.");
            }
            
            waitUntil(handleMembershipCreated(membership));
        }
        
        // 2. Handle Payment (Renewals -> XP Award)
        if (webhookData.type === "payment.succeeded") {
             const payment = webhookData.data;
             console.log("💰 Payment received from Whop ID:", payment.user_id);

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

    // Fallback update for legacy placeholder if needed
    // In multi-tenant, ensureWhopContext handles creation, 
    // but this can update plan tiers for existing.
    // For now we log it as the specific ID update is preferred.
}