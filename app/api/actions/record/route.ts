import { NextResponse } from "next/server";
import { api } from "@/services/api";
import { supabaseServer } from "@/lib/supabaseServer";
import { ActionType } from "@/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // External tools (like Discord bots) send the Whop ID and the Action Type
    const { whopUserId, actionType } = body;

    if (!whopUserId || !actionType) {
      return NextResponse.json({ success: false, error: "Missing whopUserId or actionType" }, { status: 400 });
    }

    console.log(`Received external action: ${actionType} for Whop User: ${whopUserId}`);

    // 1. Resolve Whop ID to Internal Supabase ID
    // We use supabaseServer (admin) because RLS might block a direct lookup from an anon request
    const { data: userProfile, error: userError } = await supabaseServer
      .from('profiles')
      .select('id')
      .eq('whop_user_id', whopUserId)
      .single();

    if (userError || !userProfile) {
      console.error("User not found:", whopUserId);
      return NextResponse.json({ success: false, error: "User not found in database" }, { status: 404 });
    }

    const internalUserId = userProfile.id;

    // 2. Trigger the Gamification Engine
    // FIX: Use 'discord' as the source to match api.ts types
    const result = await api.recordAction(internalUserId, actionType as ActionType, "discord");

    if (!result) {
      return NextResponse.json({ success: false, error: "Failed to record action" }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      xpGained: result.xpGained,
      message: `Awarded ${result.xpGained} XP to user.`
    });

  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}