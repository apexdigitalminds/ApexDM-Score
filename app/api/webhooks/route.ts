import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { supabaseAdmin } from "@/lib/supabase-admin"; 
// Import the FIXED provisioning logic we wrote
import { ensureWhopContext, recordActionServer } from "@/app/actions"; 

export async function POST(request: NextRequest): Promise<Response> {
    const requestBodyText = await request.text();
    const headers = Object.fromEntries(request.headers);
    
    try {
        let webhookData;
        // Verify Signature (Prod) or Parse JSON (Dev)
        if (process.env.NODE_ENV === 'development') {
            try {
                webhookData = JSON.parse(requestBodyText);
            } catch (e) {
                webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
            }
        } else {
            webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
        }

        console.log(`🔔 Webhook Received: ${webhookData.type}`);

        // 🟢 HANDLE APP INSTALL / MEMBERSHIP CREATE
        if (webhookData.type === "membership.created" || webhookData.type === "app.installed") {
            const payload = webhookData.data;
            
            // Extract IDs aggressively
            const companyId = 
                webhookData.company_id || 
                (payload as any).company_id || 
                (payload as any).store_id ||
                (payload as any).team_id; // Sometimes 'team_id' in B2B

            const userId = (payload as any).user_id || (payload as any).user?.id;

            if (companyId && userId) {
                console.log(`🚀 Webhook Provisioning: Company[${companyId}] User[${userId}]`);
                
                // 🟢 FORCE ADMIN ROLE
                // If this is an 'app.installed' event, or the first 'membership.created', 
                // we treat the user as an Admin/Owner to ensure they get access.
                const roles = ['admin', 'owner']; 

                // Run the fixed provisioning logic
                waitUntil(ensureWhopContext(companyId, userId, roles));
            } else {
                console.warn("⚠️ Webhook missing IDs:", JSON.stringify(webhookData, null, 2));
            }
        }
        
        return new Response("OK", { status: 200 });
    } catch (error: any) {
        console.error("❌ Webhook Error:", error.message);
        return new Response(`Error: ${error.message}`, { status: 400 });
    }
}