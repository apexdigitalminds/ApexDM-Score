import { redirect } from 'next/navigation';
import LandingPage from './components/bolt/LandingPage'; // Adjust path if needed
import Layout from './components/bolt/Layout'; // Adjust path if needed

export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
    // 1. Extract Whop Context from URL (iframe params)
    const companyId = 
        (searchParams['companyId'] as string) || 
        (searchParams['company_id'] as string) || 
        (searchParams['experience_id'] as string);

    // 2. Redirect to the Dynamic Dashboard
    if (companyId) {
        console.log(`🔀 Landing Page Redirecting to: /dashboard/${companyId}`);
        redirect(`/dashboard/${companyId}`);
    }

    // 3. Fallback
    return (
        <Layout>
            <LandingPage />
        </Layout>
    );
}