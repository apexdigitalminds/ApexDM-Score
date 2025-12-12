import { redirect } from 'next/navigation';
import LandingPage from '../app/components/bolt/LandingPage';
import Layout from '../app/components/bolt/Layout';

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
    // 🔍 DEBUG: Log ALL params to see what Whop is sending
    console.log("------------------------------------------------");
    console.log("🔍 LANDING PAGE PARAMS RECEIVED:", JSON.stringify(searchParams, null, 2));
    console.log("------------------------------------------------");

    // 1. Extract Whop Context
    const companyId = 
        (searchParams['companyId'] as string) || 
        (searchParams['company_id'] as string) || 
        (searchParams['experience_id'] as string) ||
        (searchParams['biz_id'] as string); // Sometimes used

    // 2. Redirect if ID found
    if (companyId) {
        console.log(`🔀 Redirecting to Dashboard: /dashboard/${companyId}`);
        redirect(`/dashboard/${companyId}`);
    }

    // 3. Fallback
    console.warn("⚠️ No Company ID found. Staying on Landing Page.");
    return (
        <Layout>
            <LandingPage />
        </Layout>
    );
}