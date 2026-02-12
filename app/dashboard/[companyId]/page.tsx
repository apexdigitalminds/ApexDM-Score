// File: app/dashboard/[companyId]/page.tsx

import { redirect } from "next/navigation";
import { api } from "@/services/api";
import { verifyUser } from "@/app/actions";
import DashboardClient from "@/app/components/DashboardClient";

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ companyId: string }>;
}) {
  const { companyId } = await params;

  if (!companyId) {
    console.error("❌ No Company ID in route params");
    redirect("/");
  }

  console.log(`🎯 Dashboard Loading for Company: ${companyId}`);

  const session = await verifyUser(companyId);

  if (!session) {
    console.error("❌ Auth Failed for Company:", companyId);
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-slate-900">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Session Expired
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Your session could not be verified. This usually happens after a period of inactivity.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg transition-colors"
          >
            Refresh Page
          </button>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-6">
            If this persists, try reopening the app from your Whop dashboard.
          </p>
        </div>
      </div>
    );
  }

  console.log(`✅ User authenticated: ${session.userId} (${session.role})`);

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