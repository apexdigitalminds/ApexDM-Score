import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { ensureWhopContext } from "@/app/actions"; 

export async function POST(request: NextRequest): Promise<Response> {
    const requestBodyText = await request.text();
    const headers = Object.fromEntries(request.headers);
    
    try {
        let webhookData;
        try {
            // Verify Signature
            webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
        } catch (e) {
            console.warn("⚠️ Webhook Signature Invalid (Dev Mode?):", e);
            webhookData = JSON.parse(requestBodyText);
        }

        console.log(`🔔 Webhook Received: ${webhookData.type}`);
        console.log("📦 Payload Snippet:", JSON.stringify(webhookData, null, 2).substring(0, 500));

        // 🟢 FIX: Listen for the events you actually have
        const allowedEvents = [
            "app.installed", 
            "membership.created", 
            "membership_activated", 
            "payment_succeeded", 
            "payment.succeeded"
        ];

        if (allowedEvents.includes(webhookData.type)) {
            const payload = webhookData.data || webhookData; // Handle different payload shapes
            
            // 3. Extract IDs (Aggressive Search)
            // Whop sometimes puts company_id at the root, sometimes inside 'data'
            const companyId = 
                webhookData.company_id || 
                payload.company_id || 
                payload.company?.id ||
                payload.team_id;

            // User ID might be inside 'user' object or 'user_id' field
            const userId = 
                payload.user_id || 
                payload.user?.id || 
                webhookData.user_id;

            if (companyId && userId) {
                console.log(`🚀 Provisioning Triggered: Company[${companyId}] User[${userId}]`);
                
                // Force Admin role for these setup events
                const roles = ['admin', 'owner']; 

                // Run the DB Creation Logic
                waitUntil(ensureWhopContext(companyId, userId, roles));
                
                return new Response("Provisioning Started", { status: 200 });
            } else {
                console.warn("⚠️ Webhook received but IDs missing. Check Payload Log.");
                return new Response("Missing IDs", { status: 400 });
            }
        }
        
        return new Response("Ignored Event", { status: 200 });

    } catch (error: any) {
        console.error("❌ Webhook Fatal Error:", error.message);
        return new Response(`Error: ${error.message}`, { status: 500 });
    }
}