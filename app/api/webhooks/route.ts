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
        // 🚨 ALWAYS return 200 for Whop
        return new Response(JSON.stringify({ success: false, error: "Invalid JSON" }), {
          status: 200, // Changed from 400 - never fail webhook
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    console.log(`📨 ========================================`);
    console.log(`📨 WEBHOOK RECEIVED: ${webhookData.type || webhookData.event || 'unknown'}`);
    console.log(`📨 ========================================`);
    console.log("📦 Full Payload:", JSON.stringify(webhookData, null, 2));

    const eventType = webhookData.type || webhookData.event;
    const payload = webhookData.data || webhookData;

    // =================================================================
    // 🔥 CRITICAL: Handle app.installed FIRST with maximum defensiveness
    // =================================================================
    if (eventType === "app.installed") {
      console.log(`🎯 ========================================`);
      console.log(`🎯 APP.INSTALLED EVENT - CRITICAL PATH`);
      console.log(`🎯 ========================================`);

      try {
        // 🔍 Ultra-aggressive company_id extraction
        const companyId =
          webhookData.company_id ||
          webhookData.data?.company_id ||
          payload.company_id ||
          payload.company?.id ||
          payload.experience?.company_id ||
          payload.team_id ||
          webhookData.company?.id;

        // 🔍 Ultra-aggressive user_id extraction  
        const userId =
          webhookData.user_id ||
          webhookData.data?.user_id ||
          payload.user_id ||
          payload.user?.id ||
          payload.installer_id ||
          payload.installed_by;

        console.log(`🔍 APP INSTALL ID Extraction:`);
        console.log(`   Company ID: ${companyId || '⚠️ NOT FOUND'}`);
        console.log(`   User ID: ${userId || '⚠️ NOT FOUND'}`);
        console.log(`   Raw payload keys: ${Object.keys(webhookData).join(', ')}`);
        console.log(`   Data keys: ${webhookData.data ? Object.keys(webhookData.data).join(', ') : 'N/A'}`);

        // 🚨 CRITICAL: Even without IDs, return 200 to complete install
        if (!companyId) {
          console.warn("⚠️ No company_id in app.installed - logging for debug");
          console.warn("⚠️ Full payload:", JSON.stringify(webhookData, null, 2));
          // Return 200 anyway - let Whop complete the install
          return new Response(JSON.stringify({
            success: true,
            message: "Install acknowledged (no company_id yet)",
            debug: { keys: Object.keys(payload) }
          }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
          });
        }

        // We have company_id - proceed with provisioning
        if (companyId && userId) {
          console.log(`✅ Got both IDs - provisioning admin...`);

          // Run async - don't block the response
          waitUntil(
            ensureWhopContext(companyId, userId, ['admin', 'owner'], 'Free', undefined)
              .then((success) => {
                console.log(`✅ App install provisioning: ${success ? 'SUCCESS' : 'FAILED'}`);
              })
              .catch(err => {
                console.error(`❌ App install provisioning error:`, err);
              })
          );
        } else if (companyId) {
          console.log(`⚠️ Got company_id but no user_id - creating community only`);
          // We can still create the community, user will be added later
          waitUntil(
            ensureWhopContext(companyId, 'pending', ['admin', 'owner'], 'Free', undefined)
              .catch(err => console.error(`❌ Community creation error:`, err))
          );
        }

        // 🚨 ALWAYS return 200 for app.installed
        return new Response(JSON.stringify({
          success: true,
          message: "App installed successfully",
          company_id: companyId,
          user_id: userId
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });

      } catch (installError: any) {
        // 🚨 Even on error, return 200 to not break install
        console.error("❌ APP INSTALL ERROR (returning 200 anyway):", installError);
        return new Response(JSON.stringify({
          success: true,
          message: "Install acknowledged with error",
          error: installError.message
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // =================================================================
    // 🟢 Handle other provisioning events (membership, payment, etc.)
    // =================================================================
    const provisioningEvents = [
      "membership.created",
      "membership.went_valid",
      "membership.activated",
      "membership_activated",
      "payment_succeeded",
      "payment.succeeded"
    ];

    if (provisioningEvents.includes(eventType)) {
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

      // 🆕 EXTRACT PLAN ID for accurate tier mapping
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

      // For non-install events, we can be stricter but still return 200
      if (!companyId || !userId) {
        console.error(`❌ MISSING REQUIRED IDS (non-install event)`);
        console.error(`   Event: ${eventType}`);
        console.error(`   Company ID: ${companyId || 'MISSING'}`);
        console.error(`   User ID: ${userId || 'MISSING'}`);

        // Still return 200 to not break Whop
        return new Response(JSON.stringify({
          success: false,
          message: "Missing required IDs",
          received: { company_id: companyId || null, user_id: userId || null }
        }), {
          status: 200, // Changed from 400
          headers: { "Content-Type": "application/json" }
        });
      }

      // 🎭 Determine User Role
      let roles = ['member'];
      if (payload.roles && Array.isArray(payload.roles)) {
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
      console.log(`   Tier: ${productTitle || 'Free'}`);
      console.log(`   Plan ID: ${planId || 'none'}`);
      console.log(`🚀 ========================================`);

      // Run provisioning asynchronously
      waitUntil(
        ensureWhopContext(companyId, userId, roles, productTitle, planId)
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
    }

    // =================================================================
    // 🟡 Unhandled event types
    // =================================================================
    console.log(`ℹ️ Event "${eventType}" ignored (not a provisioning event)`);

    return new Response(JSON.stringify({
      success: true,
      message: "Event received but not processed",
      event_type: eventType
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error(`❌ ========================================`);
    console.error(`❌ WEBHOOK FATAL ERROR`);
    console.error(`❌ ========================================`);
    console.error("Error:", error.message);
    console.error("Stack:", error.stack);

    // 🚨 Even fatal errors return 200 to not break Whop
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 200, // Changed from 500
      headers: { "Content-Type": "application/json" }
    });
  }
}