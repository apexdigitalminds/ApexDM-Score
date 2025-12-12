import { redirect } from "next/navigation";
import { api } from "@/services/api"; 
import { verifyUser } from "@/app/actions"; 
// 🟢 FIX: Use the '@' alias to find the component reliably
import DashboardClient from "@/app/components/DashboardClient"; 

export default async function DashboardPage({
  params,
}: {
  params: { companyId: string };
}) {
  const { companyId } = params;

  if (!companyId) {
    console.error("❌ No Company ID in route params");
    redirect("/"); 
  }

  console.log(`🔍 Dashboard Loading for Company: ${companyId}`);

  // 1. PROVISIONING HANDSHAKE
  // We pass the route ID directly to the server action.
  const session = await verifyUser(companyId);

  if (!session) {
    console.error("❌ Auth Failed for Company:", companyId);
    redirect("/"); 
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
      companyId={companyId}
    />
  );
}