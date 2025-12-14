import { redirect } from "next/navigation";
import { api } from "@/services/api"; 
import { verifyUser, getCompanyIdFromExperience } from "@/app/actions"; // Import the new helper
import DashboardClient from "@/app/components/DashboardClient"; 

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  if (!experienceId) {
    console.error("❌ No Experience ID in route params");
    redirect("/"); 
  }

  console.log(`🔍 Experience Loading: ${experienceId}`);

  // 🟢 1. RESOLVE COMPANY ID (The Missing Link)
  // We use the ID from the URL to find the Company ID via API
  const companyId = await getCompanyIdFromExperience(experienceId);

  if (!companyId) {
      console.error("❌ Could not resolve Company ID from Experience:", experienceId);
      return (
        <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Setup Required</h1>
                <p>Could not identify the company for this experience.</p>
                <p className="text-sm text-slate-500 mt-2">ID: {experienceId}</p>
            </div>
        </div>
      );
  }

  // 🟢 2. PROVISIONING HANDSHAKE
  // Now we pass the resolved 'companyId' to verifyUser.
  // This guarantees the database row is created.
  const session = await verifyUser(companyId);

  if (!session) {
    console.error("❌ Auth Failed for Company:", companyId);
    return (
        <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Authentication Failed</h1>
                <p>Please refresh the page to try again.</p>
            </div>
        </div>
    );
  }

  // 3. Fetch Data
  const [userProfile, actions, communityInfo] = await Promise.all([
    api.getCurrentUserProfile(),
    api.getUserActions(session.userId),
    api.getCommunityInfo(),
  ]);

  // 4. Render Client Component
  return (
    <DashboardClient 
      user={userProfile} 
      actions={actions} 
      community={communityInfo}
      companyId={companyId}
    />
  );
}