import { redirect } from "next/navigation";
import { api } from "@/services/api"; 
import { verifyUser } from "@/app/actions"; 
import DashboardClient from "@/app/components/DashboardClient"; 

export default async function ExperiencePage({
  params,
}: {
  params: { experienceId: string };
}) {
  const { experienceId } = params;

  if (!experienceId) {
    console.error("❌ No Experience ID in route params");
    redirect("/"); 
  }

  console.log(`🔍 Experience Loading: ${experienceId}`);

  // 1. PROVISIONING HANDSHAKE
  // This triggers the DB creation logic you need.
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
      // 🟢 FIX: Use '.id' (UUID) instead of '.whop_store_id'.
      // The API service doesn't return whop_store_id in the mapped object, 
      // but 'id' is always present and valid for the client to use.
      companyId={communityInfo?.id || ""}
    />
  );
}