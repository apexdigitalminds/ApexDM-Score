import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabaseServer";

/**
 * POST /api/integrations/pulse/xp
 *
 * Receives XP awards from CommunityPulse after survey completions.
 * Unlike /api/actions/record (which looks up XP from reward_actions config),
 * this endpoint accepts a raw xpAmount — CommunityPulse admins set XP per survey.
 *
 * Body: { whopUserId, xpAmount, surveyId, communityId }
 * Header: Authorization: Bearer <shared secret>
 */
export async function POST(req: Request) {
    try {
        // Verify shared secret
        const authHeader = req.headers.get("Authorization");
        const secret = process.env.PULSE_INTEGRATION_SECRET;

        if (!secret) {
            console.error("PULSE_INTEGRATION_SECRET not configured");
            return NextResponse.json(
                { success: false, error: "Integration not configured" },
                { status: 500 }
            );
        }

        if (!authHeader || authHeader !== `Bearer ${secret}`) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { whopUserId, xpAmount, surveyId } = body;

        if (!whopUserId || !xpAmount || xpAmount <= 0) {
            return NextResponse.json(
                { success: false, error: "Missing whopUserId or invalid xpAmount" },
                { status: 400 }
            );
        }

        console.log(`📋 Pulse XP award: ${xpAmount} XP for user ${whopUserId} (survey: ${surveyId})`);

        // 1. Resolve Whop user ID → internal profile ID
        const { data: userProfile, error: userError } = await supabaseServer
            .from("profiles")
            .select("id, community_id")
            .eq("whop_user_id", whopUserId)
            .single();

        if (userError || !userProfile) {
            console.error("User not found in CommunityXP:", whopUserId);
            return NextResponse.json(
                { success: false, error: "User not found in CommunityXP" },
                { status: 404 }
            );
        }

        // 2. Award XP directly (bypass reward_actions lookup)
        const { error: xpError } = await supabaseServer.rpc("increment_user_xp", {
            p_user_id: userProfile.id,
            p_xp_to_add: xpAmount,
        });

        if (xpError) {
            console.error("Failed to increment XP:", xpError.message);
            return NextResponse.json(
                { success: false, error: "Failed to award XP" },
                { status: 500 }
            );
        }

        // 3. Log the action for history/audit
        await supabaseServer.from("actions_log").insert({
            user_id: userProfile.id,
            community_id: userProfile.community_id,
            action_type: "pulse_survey",
            xp_gained: xpAmount,
            source: "pulse_survey",
        });

        console.log(`✅ Awarded ${xpAmount} XP to user ${userProfile.id} via CommunityPulse`);

        return NextResponse.json({
            success: true,
            xpAwarded: xpAmount,
            message: `Awarded ${xpAmount} XP to user for survey completion.`,
        });
    } catch (err: any) {
        console.error("Pulse integration error:", err.message);
        return NextResponse.json(
            { success: false, error: err.message },
            { status: 500 }
        );
    }
}
