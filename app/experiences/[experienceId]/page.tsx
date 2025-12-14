import { redirect } from "next/navigation";
import { api } from "@/services/api"; 
import { verifyUser } from "@/app/actions"; 
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

  // 🟢 1. AUTHENTICATE (Database First)
  // We call this WITHOUT arguments. It will check the DB for the user.
  // If the webhook worked, this succeeds immediately.
  const session = await verifyUser();

  if (!session) {
    console.error("❌ Auth Failed. User not in DB and no Context provided.");
    return (
        <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
            <div className="text-center">
                <h1 className="text-2xl font-bold mb-2">Welcome!</h1>
                <p>We are setting up your account.</p>
                <p className="text-sm text-slate-500 mt-2">Please refresh this page in 30 seconds.</p>
            </div>
        </div>
    );
  }

  // 2. Fetch Data
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
      companyId={communityInfo?.id || ""}
    />
  );
}