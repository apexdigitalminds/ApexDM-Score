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

  // 🆕 INSTALL-SAFE: Check for valid session (not guest/error/pending)
  const invalidSessionStates = ['guest', 'pending', 'error', null, undefined];
  const hasValidSession = session &&
    session.userId &&
    !invalidSessionStates.includes(session.userId) &&
    session.communityId;

  if (!hasValidSession) {
    console.log("⚠️ Session state:", session?.userId, "- showing install/setup page");

    // 🆕 INSTALL-SAFE: Return a simple welcome page instead of error
    // This allows the app to load successfully during install
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white flex items-center justify-center">
        <div className="text-center max-w-md p-8">
          <h1 className="text-3xl font-bold mb-4">🎉 Welcome to ApexDM Score!</h1>
          <p className="text-gray-400 mb-6">
            Your gamification platform is being set up.
            Please wait a moment while we configure your community.
          </p>
          <div className="animate-pulse text-blue-400">
            Setting up your experience...
          </div>
        </div>
      </div>
    );
  }

  // 🟢 STEP 3: FETCH DATA (only with valid session)
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