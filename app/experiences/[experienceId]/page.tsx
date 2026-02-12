// File: app/experiences/[experienceId]/page.tsx

import { redirect } from "next/navigation";
import { api } from "@/services/api";
import { verifyUser } from "@/app/actions";
import { getCompanyIdFromExperience } from "@/lib/whop-helpers";
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

  // STEP 1: RESOLVE CONTEXT
  const companyId = await getCompanyIdFromExperience(experienceId);

  if (!companyId) {
    console.error(`❌ Could not resolve company for experience: ${experienceId}`);
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">⚙️</div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Setup Required
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Could not identify the community for this app. Please ensure the app is properly installed.
          </p>
        </div>
      </div>
    );
  }

  // STEP 2: AUTHENTICATE
  const session = await verifyUser(companyId);

  if (!session) {
    console.error("❌ Auth Failed for Experience:", experienceId);
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
            Session Expired
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your session could not be verified. This usually happens after a period of inactivity.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500">
            Try refreshing the page or reopening the app from your Whop dashboard.
          </p>
        </div>
      </div>
    );
  }

  // STEP 3: FETCH DATA
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