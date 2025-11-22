import { NextResponse } from "next/server";
import { supabase } from "@/services/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    if (!companyId) {
      return NextResponse.json({ error: "Missing companyId" }, { status: 400 });
    }

    // 1. Get Community Info & Subscription Status
    const { data: community, error: communityError } = await supabase
      .from("communities")
      .select("id, subscription_tier")
      .limit(1)
      .single();

    if (communityError || !community) {
      console.error("Error fetching community:", communityError?.message);
      return NextResponse.json({ error: "Community not found" }, { status: 404 });
    }

    const communityIdDb = community.id;

    // 2. Get Total Members & Total XP
    // We sum the 'xp' column and count the rows in 'profiles'
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("xp, last_action_date")
      .eq("community_id", communityIdDb);

    if (profilesError) throw profilesError;

    const totalMembers = profiles.length;
    const totalXpAwarded = profiles.reduce((sum, p) => sum + (p.xp || 0), 0);

    // 3. Calculate Active Members (Active in last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const activeMembers = profiles.filter(
      (p) => p.last_action_date && new Date(p.last_action_date) >= sevenDaysAgo
    ).length;

    // 4. Get Weekly Actions Count
    const { count: weeklyActions, error: actionsError } = await supabase
      .from("actions_log")
      .select("*", { count: "exact", head: true }) // 'head: true' means we only want the count, not data
      .eq("community_id", communityIdDb)
      .gte("created_at", sevenDaysAgo.toISOString());

    if (actionsError) throw actionsError;

    // 5. Construct the Response Object
    // Matches 'AdminMetrics' interface in AdminDashboard.tsx
    const metrics = {
      companyId,
      totalMembers,
      activeMembers,
      weeklyActions: weeklyActions || 0,
      totalXpAwarded,
      isActiveSubscription: community.subscription_tier !== "Free", // Logic: Any tier not 'Free' is active
      trialEndsAt: null, // Logic can be added here if you track trials
    };

    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error("API Error in /api/admin/metrics:", error.message);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}