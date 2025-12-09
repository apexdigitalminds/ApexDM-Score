import { waitUntil } from "@vercel/functions";
import type { Payment, Membership } from "@whop/sdk/resources"; 
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { supabaseAdmin } from "@/lib/supabase-admin"; 
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
                webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
            }
        } else {
            // 🔒 PROD: Verify signature
            webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
        }

        // 1. Handle New Subscription (User buys a pass)
        if (webhookData.type === "membership.created") {
            waitUntil(handleMembershipCreated(webhookData.data));
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

        // 🟢 3. NEW: Handle App Installation (The "Handshake")
        if (webhookData.type === "app.installed") {
            const companyId = webhookData.company_id; // Extract Real ID
            console.log(`🚀 App Installed on Company: ${companyId}`);

            // A. Find the existing placeholder community (or the first one)
            const { data: existingComm } = await supabaseAdmin
                .from('communities')
                .select('id')
                .limit(1)
                .single();

            if (existingComm) {
                // B. Update the ID to match the Real Whop ID
                // Note: We use a raw SQL query or special update because changing primary keys 
                // via standard ORM methods can be tricky depending on constraints. 
                // For simplicity here, we update the existing row's other fields or 
                // if ID is editable, we swap it. 
                // Better approach for Single Tenant: Update the tracking ID field.
                
                // Assuming you want to overwrite the "Apex Traders" mock ID with the Real ID:
                // We will delete the mock and insert the real one to ensure clean state, 
                // OR update if your schema allows UUID updates.
                
                // SAFE APPROACH: Update properties, assume ID might be fixed or handled by a mapping.
                // But typically for Whop Apps, we want the database ID to MATCH the Whop Company ID.
                
                // Let's try to update the ID directly if Supabase allows (usually blocked by FKs).
                // Instead, we will store the 'whop_company_id' if you have that column, 
                // OR we just log it for now since we are waiting for Whop Support to fix the token scope.
                
                // REAL FIX: Since your schema has 'id' as UUID and Whop IDs are strings (biz_...), 
                // you might have a mismatch. If Whop ID is "biz_...", it won't fit in a UUID column.
                // CHECK: Is your communities.id a UUID or TEXT?
                // Your schema dump says: id (UUID). Whop IDs are usually strings like "biz_123".
                // This means you CANNOT store the Whop ID in the primary key 'id' column.
                
                // ACTION: We will store it in the 'whop_company_id' column instead.
                const { error } = await supabaseAdmin
                    .from('communities')
                    .update({ 
                        whop_company_id: companyId,
                        whop_connected_at: new Date().toISOString()
                    })
                    .eq('id', existingComm.id);

                if (error) console.error("Failed to link Company ID:", error);
                else console.log("✅ Successfully linked Whop Company ID to Database.");
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

    // Update Database
    const { error } = await supabaseAdmin
        .from('communities')
        .update({ 
            subscription_tier: newTier,
            trial_ends_at: trialEnd 
        })
        .neq('id', '00000000-0000-0000-0000-000000000000'); 

    if (error) console.error("DB Update Failed:", error.message);
}