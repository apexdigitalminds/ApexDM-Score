import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { ensureWhopContext } from "@/app/actions"; 

export async function POST(request: NextRequest): Promise<Response> {
  const requestBodyText = await request.text();
  const headers = Object.fromEntries(request.headers);
  
  try {
    let webhookData;
    
    // Verify webhook signature
    try {
      webhookData = whopsdk.webhooks.unwrap(requestBodyText, { headers });
    } catch (e) {
      console.warn("⚠️ Webhook Signature Verification Failed (Dev Mode?):", e);
      // In development, allow unsigned webhooks
      try {
        webhookData = JSON.parse(requestBodyText);
      } catch (parseError) {
        console.error("❌ Failed to parse webhook JSON:", parseError);
        return new Response(JSON.stringify({ error: "Invalid JSON" }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    console.log(`📨 ========================================`);
    console.log(`📨 WEBHOOK RECEIVED: ${webhookData.type}`);
    console.log(`📨 ========================================`);
    console.log("📦 Full Payload:", JSON.stringify(webhookData, null, 2));

    // 🟢 Events that should trigger user/community provisioning
    const provisioningEvents = [
      "app.installed",           // App is installed to a company
      "membership.created",       // New user gets access
      "membership.went_valid",   // User's membership becomes active
      "membership_activated",     // Legacy event name
      "payment_succeeded",        // User makes a payment
      "payment.succeeded"         // User makes a payment (alternate)
    ];

    if (provisioningEvents.includes(webhookData.type)) {
      const payload = webhookData.data || webhookData;
      
      // 🔍 AGGRESSIVE ID EXTRACTION
      // Whop's webhook structure varies by event type, so we check all possible locations
      const companyId = 
        webhookData.company_id ||           // Root level
        payload.company_id ||               // Inside data
        payload.company?.id ||              // Nested in company object
        payload.team_id ||                  // Some events use team_id
        payload.experience?.company_id ||   // Inside experience
        webhookData.data?.company_id ||     // Double-nested
        payload.membership?.company_id;     // Inside membership

      const userId = 
        payload.user_id ||                  // Inside data
        payload.user?.id ||                 // Nested in user object
        webhookData.user_id ||              // Root level
        payload.membership?.user_id ||      // Inside membership
        webhookData.data?.user_id ||        // Double-nested
        payload.membership?.user?.id;       // Deep nested

      console.log(`🔍 ID Extraction Results:`);
      console.log(`   Company ID: ${companyId || '❌ NOT FOUND'}`);
      console.log(`   User ID: ${userId || '❌ NOT FOUND'}`);

      // Validate we have both IDs
      if (!companyId || !userId) {
        console.error(`❌ MISSING REQUIRED IDS`);
        console.error(`   Event: ${webhookData.type}`);
        console.error(`   Company ID: ${companyId || 'MISSING'}`);
        console.error(`   User ID: ${userId || 'MISSING'}`);
        console.error(`   `);
        console.error(`   Full payload above - check structure`);
        
        return new Response(JSON.stringify({ 
          success: false,
          error: "Missing required IDs",
          received: {
            company_id: companyId || null,
            user_id: userId || null
          }
        }), { 
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 🎭 Determine User Role
      let roles = ['member']; // Default role
      
      if (webhookData.type === 'app.installed') {
        // First install = make them admin
        roles = ['admin', 'owner'];
        console.log(`👑 App Install Event - User will be ADMIN`);
      } else if (payload.roles && Array.isArray(payload.roles)) {
        // Use roles from webhook if provided
        roles = payload.roles;
        console.log(`👤 Using roles from webhook: [${roles.join(', ')}]`);
      } else {
        console.log(`👤 Default role: member`);
      }

      // 🚀 Start Provisioning
      console.log(`🚀 ========================================`);
      console.log(`🚀 STARTING PROVISIONING`);
      console.log(`   Company: ${companyId}`);
      console.log(`   User: ${userId}`);
      console.log(`   Roles: [${roles.join(', ')}]`);
      console.log(`🚀 ========================================`);

      // Run provisioning asynchronously (don't block webhook response)
      waitUntil(
        ensureWhopContext(companyId, userId, roles)
          .then((success) => {
            if (success) {
              console.log(`✅ Provisioning completed for ${userId}`);
            } else {
              console.error(`❌ Provisioning failed for ${userId}`);
            }
          })
          .catch(err => {
            console.error(`❌ Provisioning error for ${userId}:`, err);
          })
      );
      
      return new Response(JSON.stringify({ 
        success: true, 
        message: "Provisioning started",
        company_id: companyId,
        user_id: userId
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
      
    } else {
      // Event is not one we need to act on
      console.log(`ℹ️ Event "${webhookData.type}" ignored (not a provisioning event)`);
      
      return new Response(JSON.stringify({ 
        success: true,
        message: "Event received but not processed",
        event_type: webhookData.type
      }), { 
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

  } catch (error: any) {
    console.error(`❌ ========================================`);
    console.error(`❌ WEBHOOK FATAL ERROR`);
    console.error(`❌ ========================================`);
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);
    
    return new Response(JSON.stringify({ 
      success: false,
      error: error.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}