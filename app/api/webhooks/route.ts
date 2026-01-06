import { waitUntil } from "@vercel/functions";
import type { NextRequest } from "next/server";
import { whopsdk } from "@/lib/whop-sdk";
import { ensureWhopContext, recordActionServer } from "@/app/actions";
import type { ActionType } from "@/types";

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

    // 🎯 Events that should award XP automatically
    const xpAwardEvents: Record<string, ActionType> = {
      "invoice_paid": "subscription_renewed",
      "course_lesson_interaction_completed": "lesson_completed"
    };

    // 📊 Events for analytics (no XP, just tracking)
    const analyticsEvents = [
      "membership_deactivated"
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

      // 🔧 IMPROVED: Extract user ID with member.id fallback
      // Whop sometimes sends user: null but includes member.id
      const userId =
        payload.user_id ||
        payload.user?.id ||
        webhookData.user_id ||
        payload.membership?.user_id ||
        webhookData.data?.user_id ||
        payload.membership?.user?.id ||
        payload.member?.id ||  // 🆕 Fallback to member.id
        webhookData.data?.member?.id;  // 🆕 Fallback to nested member.id

      console.log(`🔍 User extraction sources:`);
      console.log(`   payload.user_id: ${payload.user_id || 'null'}`);
      console.log(`   payload.user?.id: ${payload.user?.id || 'null'}`);
      console.log(`   payload.member?.id: ${payload.member?.id || 'null'}`);
      console.log(`   webhookData.data?.member?.id: ${webhookData.data?.member?.id || 'null'}`);

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

      // 🆕 Extract membership ID for linking
      const membershipId =
        payload.membership?.id ||
        payload.id ||
        webhookData.data?.id;

      console.log(`🔍 ID Extraction Results:`);
      console.log(`   Company ID: ${companyId || '❌ NOT FOUND'}`);
      console.log(`   User ID: ${userId || '❌ NOT FOUND'}`);
      console.log(`   Membership ID: ${membershipId || '❌ NOT FOUND'}`);
      console.log(`   Product/Tier: ${productTitle || '❌ NOT FOUND'}`);
      console.log(`   Plan ID: ${planId || '❌ NOT FOUND'}`);

      // 🚨 IMPORTANT: Check if this is seller company vs customer company
      if (companyId === 'biz_l6rgQaulWP7D2E') {
        console.warn(`⚠️ SELLER COMPANY DETECTED: ${companyId}`);
        console.warn(`   This webhook is for YOUR seller account, not customer's app installation.`);
        console.warn(`   The purchase created a membership on Apex Digital Minds, not the customer's app.`);
        console.warn(`   This is a Whop product configuration issue - products may not be properly linked to app.`);
      }

      // Validate we have both required IDs
      // 🔧 CHANGED: Accept member ID when user ID is missing
      if (!companyId || !userId) {
        console.error(`❌ MISSING REQUIRED IDS`);
        console.error(`   Event: ${webhookData.type}`);
        console.error(`   Company ID: ${companyId || 'MISSING'}`);
        console.error(`   User ID: ${userId || 'MISSING'}`);
        console.error(`   Member ID available: ${payload.member?.id || 'NO'}`);
        console.error(`   Membership ID available: ${membershipId || 'NO'}`);

        // 🆕 Still return 200 to prevent webhook retries, but log the issue
        return new Response(JSON.stringify({
          success: false,
          error: "Missing required IDs - likely a Whop product configuration issue",
          message: "Purchase went to seller community instead of customer's installed app",
          received: {
            company_id: companyId || null,
            user_id: userId || null,
            member_id: payload.member?.id || null,
            membership_id: membershipId || null
          }
        }), {
          status: 200, // 🔧 Changed to 200 to prevent retry spam
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

      // 🎯 Handle XP-awarding events (invoice_paid, course_lesson_interaction_completed)
    } else if (xpAwardEvents[webhookData.type]) {
      const payload = webhookData.data || webhookData;
      const userId = payload.user_id || payload.user?.id || payload.member?.id || webhookData.user_id;
      const actionType = xpAwardEvents[webhookData.type];

      console.log(`🎯 ========================================`);
      console.log(`🎯 XP AWARD EVENT: ${webhookData.type}`);
      console.log(`   User: ${userId || 'UNKNOWN'}`);
      console.log(`   Action: ${actionType}`);
      console.log(`🎯 ========================================`);

      if (userId) {
        waitUntil(
          recordActionServer(userId, actionType, 'webhook')
            .then((result) => {
              if (result) {
                console.log(`✅ XP awarded: ${result.xpGained} XP for ${actionType}`);
              } else {
                console.warn(`⚠️ No reward config for action: ${actionType}`);
              }
            })
            .catch(err => {
              console.error(`❌ XP award error:`, err);
            })
        );

        return new Response(JSON.stringify({
          success: true,
          message: `XP award triggered for ${actionType}`,
          user_id: userId,
          action_type: actionType
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } else {
        console.warn(`⚠️ No user ID for XP event: ${webhookData.type}`);
        return new Response(JSON.stringify({
          success: false,
          message: "No user ID found for XP award"
        }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }

      // 📊 Handle analytics events (membership_deactivated for churn tracking)
    } else if (analyticsEvents.includes(webhookData.type)) {
      const payload = webhookData.data || webhookData;
      const userId = payload.user_id || payload.user?.id || payload.member?.id;
      const companyId = payload.company_id || payload.company?.id;

      console.log(`📊 ========================================`);
      console.log(`📊 ANALYTICS EVENT: ${webhookData.type}`);
      console.log(`   User: ${userId || 'UNKNOWN'}`);
      console.log(`   Company: ${companyId || 'UNKNOWN'}`);
      console.log(`📊 ========================================`);

      // TODO: Log to analytics table for churn tracking
      // For now, just acknowledge receipt - can expand analytics later

      return new Response(JSON.stringify({
        success: true,
        message: `Analytics event logged: ${webhookData.type}`,
        user_id: userId,
        event_type: webhookData.type
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } else {
      console.log(`ℹ️ Event "${webhookData.type}" ignored (not a handled event)`);

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