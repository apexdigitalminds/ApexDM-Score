import { headers } from "next/headers";
import { whopsdk } from "@/lib/whop-sdk";
import DashboardPage from "../../components/bolt/DashboardPage";
import Layout from "../../components/bolt/Layout";
import { AppProvider } from "@/context/AppContext";

interface ExperiencePageProps {
    verifiedUserId: string;
    experienceId: string;
}

export default async function ExperiencePage({
	params,
}: {
	params: Promise<{ experienceId: string }>;
}) {
	const { experienceId } = await params;

	// 1. Authentication Logic (Dev vs. Prod)
	let userId: string;

	if (process.env.NODE_ENV === "development") {
		// ✅ DEV MODE: Bypass verification and use the mock token
		// This MUST match the token in 'services/whopApi.ts' and your Supabase 'profiles' table
		userId = "mock_dev_token_12345";
		console.log("🚧 Running in DEV mode: Using mock Whop token.");
	} else {
		// 🔒 PROD MODE: Enforce strict Whop token verification
		try {
			const { userId: verifiedId } = await whopsdk.verifyUserToken(await headers());
			userId = verifiedId;
		} catch (e) {
			return (
				<div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">
					<div className="text-center p-8 bg-slate-800 rounded-2xl shadow-lg border border-slate-700">
						<h1 className="text-xl font-bold text-white mb-2">Access Denied</h1>
						<p>Whop user token not found.</p>
						<p className="text-sm mt-2">Please access this app through your Whop dashboard.</p>
					</div>
				</div>
			);
		}
	}

	// 2. Render the Member Dashboard
	// We wrap this in AppProvider to ensure the client-side app has access to state.
return (
    // Pass the verified ID and experience ID as props
    <AppProvider 
        verifiedUserId={userId} 
        experienceId={experienceId}
    >
        <Layout>
            <DashboardPage />
        </Layout>
    </AppProvider>
);
}