import { redirect } from "next/navigation";
import { api } from "@/services/api"; 
import { verifyUser } from "@/app/actions"; 
import DashboardClient from "@/app/components/DashboardClient"; 

export default async function ExperiencePage({
  params,
}: {
  // 🟢 FIX: Define params as a Promise for Next.js 15 compatibility
  params: Promise<{ experienceId: string }>;
}) {
  // 🟢 FIX: Await the params object
  const { experienceId } = await params;

  if (!experienceId) {
    console.error("❌ No Experience ID in route params");
    // Fallback: Try to grab it from the URL if params failed (Edge case)
    redirect("/"); 
  }

  console.log(`🔍 Experience Loading: ${experienceId}`);

  // 1. PROVISIONING HANDSHAKE
  const session = await verifyUser();

  if (!session) {
    console.error("❌ Auth Failed for Experience:", experienceId);
    return (
        <div className="p-10 text-center text-white">
            <h1 className="text-2xl font-bold">Authentication Failed</h1>
            <p>Could not verify user session.</p>
        </div>
    );
  }

  // 2. Fetch Data
  const [userProfile, actions, communityInfo] = await Promise.all([
    api.getCurrentUserProfile(),
    api.getUserActions(session.userId),
    api.getCommunityInfo(),
  ]);

  // 3. Render Client Component
  return (
    <DashboardClient 
      user={userProfile} 
      actions={actions} 
      community={communityInfo}
      companyId={communityInfo?.id || ""}
    />
  );
}