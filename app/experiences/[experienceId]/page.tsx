// File: app/experiences/[experienceId]/page.tsx

import { redirect } from "next/navigation";
import { api } from "@/services/api"; 
import { verifyUser } from "@/app/actions"; 
import { getCompanyIdFromExperience } from "@/lib/whop-helpers"; // Ensure path matches your project structure
import DashboardClient from "@/app/components/DashboardClient"; 

export default async function ExperiencePage({
  params,
}: {
  params: Promise<{ experienceId: string }>;
}) {
  const { experienceId } = await params;

  if (!experienceId) {
    redirect("/"); 
  }

  console.log(`🔍 Experience Loading: ${experienceId}`);

  // 🟢 STEP 1: RESOLVE CONTEXT
  // Use your new helper to turn experienceId -> companyId
  const companyId = await getCompanyIdFromExperience(experienceId);

  if (!companyId) {
    console.error(`❌ Could not resolve company for experience: ${experienceId}`);
    return (
        <div className="p-10 text-center text-white">
            <h1 className="text-xl font-bold">Setup Error</h1>
            <p>Could not identify the company for this experience.</p>
        </div>
    );
  }

  // 🟢 STEP 2: AUTHENTICATE
  // Now we pass the resolved companyId! 
  // This enables actions.ts to provision the user if they are missing.
  const session = await verifyUser(companyId);

  if (!session) {
    console.error("❌ Auth Failed for Experience:", experienceId);
    return (
        <div className="p-10 text-center text-white">
            <h1 className="text-xl font-bold">Authentication Failed</h1>
            <p>Please refresh the page.</p>
        </div>
    );
  }

  // 🟢 STEP 3: FETCH DATA
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