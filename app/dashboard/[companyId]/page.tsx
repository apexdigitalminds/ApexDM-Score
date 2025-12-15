// File: app/dashboard/[companyId]/page.tsx

import { redirect } from "next/navigation";
import { api } from "@/services/api"; 
import { verifyUser } from "@/app/actions"; 
import DashboardClient from "@/app/components/DashboardClient"; 

export default async function DashboardPage({
  params,
}: {
  // 🟢 Update: Promise type for Next.js 15+ compatibility
  params: Promise<{ companyId: string }>;
}) {
  // 🟢 Update: Await the params
  const { companyId } = await params;

  if (!companyId) {
    console.error("❌ No Company ID in route params");
    redirect("/"); 
  }

  console.log(`🎯 Dashboard Loading for Company: ${companyId}`);

  // 🟢 AUTH: Pass the ID explicitly. 
  // If the user isn't in the DB, this ID allows actions.ts to create them.
  const session = await verifyUser(companyId);

  if (!session) {
    console.error("❌ Auth Failed for Company:", companyId);
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-bold mb-2">🚫 Access Denied</h1>
          <p className="mb-4">Unable to verify your access to this company.</p>
          <p className="text-xs text-slate-500 mt-4">
            Company ID: {companyId}
          </p>
        </div>
      </div>
    );
  }

  console.log(`✅ User authenticated: ${session.userId} (${session.role})`);

  // 🟢 DATA: Fetch using the verified session
  const [userProfile, actions, communityInfo] = await Promise.all([
    api.getCurrentUserProfile(),
    api.getUserActions(session.userId),
    api.getCommunityInfo(),
  ]);

  return (
    <DashboardClient 
      user={userProfile} 
      actions={actions} 
      community={communityInfo} 
      companyId={companyId}
    />
  );
}