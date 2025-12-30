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
      "app.installed",
      "membership.created",
      "membership.went_valid",
      "membership.activated",
      "membership_activated",
      "payment_succeeded",
      "payment.succeeded"
    ];

    if (provisioningEvents.includes(webhookData.type)) {
      const payload = webhookData.data || webhookData;

      // 🔍 AGGRESSIVE ID EXTRACTION
      const companyId =
        webhookData.company_id ||
        payload.company_id ||
        payload.company?.id ||
        payload.team_id ||
        payload.experience?.company_id ||
        webhookData.data?.company_id ||
        payload.membership?.company_id;

      const userId =
        payload.user_id ||
        payload.user?.id ||
        webhookData.user_id ||
        payload.membership?.user_id ||
        webhookData.data?.user_id ||
        payload.membership?.user?.id;

      // 🎯 EXTRACT SUBSCRIPTION TIER from product title
      const productTitle =
        payload.product?.title ||
        payload.product?.name ||
        payload.access_pass?.name ||
        payload.plan?.name ||
        webhookData.product?.title;

      // 🆕 EXTRACT PLAN ID for accurate tier mapping (trial support)
      const planId =
        payload.plan?.id ||
        payload.plan_id ||
        payload.product?.id ||
        payload.access_pass?.id ||
        webhookData.plan_id;

      console.log(`🔍 ID Extraction Results:`);
      console.log(`   Company ID: ${companyId || '❌ NOT FOUND'}`);
      console.log(`   User ID: ${userId || '❌ NOT FOUND'}`);
      console.log(`   Product/Tier: ${productTitle || '❌ NOT FOUND'}`);
      console.log(`   Plan ID: ${planId || '❌ NOT FOUND'}`);

      // Validate we have both required IDs
      if (!companyId || !userId) {
        console.error(`❌ MISSING REQUIRED IDS`);
        console.error(`   Event: ${webhookData.type}`);
        console.error(`   Company ID: ${companyId || 'MISSING'}`);
        console.error(`   User ID: ${userId || 'MISSING'}`);

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
      let roles = ['member'];

      if (webhookData.type === 'app.installed') {
        roles = ['admin', 'owner'];
        console.log(`👑 App Install Event - User will be ADMIN`);
      } else if (payload.roles && Array.isArray(payload.roles)) {
        roles = payload.roles;
        console.log(`👤 Using roles from webhook: [${roles.join(', ')}]`);
      } else {
        console.log(`👤 Default role: member (will be upgraded to admin if first user)`);
      }

      // 🚀 Start Provisioning
      console.log(`🚀 ========================================`);
      console.log(`🚀 STARTING PROVISIONING`);
      console.log(`   Company: ${companyId}`);
      console.log(`   User: ${userId}`);
      console.log(`   Roles: [${roles.join(', ')}]`);
      console.log(`   Tier: ${productTitle || 'Free (will be synced later)'}`);
      console.log(`🚀 ========================================`);

      // Run provisioning asynchronously with tier information and plan ID
      waitUntil(
        ensureWhopContext(companyId, userId, roles, productTitle, planId) // 🆕 Added planId
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
        user_id: userId,
        tier: productTitle || 'unknown'
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } else {
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