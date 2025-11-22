import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const experienceId = searchParams.get("experienceId") || "default";

  // Mock data for now
  return NextResponse.json({
    success: true,
    user: {
      id: "7dbcd46d-7471-4120-8418-3ed124ee1183",
      username: "demo_user",
      community_id: "8bb8eec1-6aec-48bf-87f6-66a26a260476",
      xp: 1200,
      level: 4,
      role: "member",
    },
    experienceId,
  });
}
