// app/page.tsx
import { verifyUser } from './actions';
import HomeClient from '../app/components/HomeClient';

// Server Components receive 'searchParams' as a prop
export default async function Page({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
    // 1. Extract Company/Experience ID from URL (e.g. ?company_id=xyz)
    // Whop typically sends: company_id or experience_id
    const companyId = 
        (searchParams['companyId'] as string) || 
        (searchParams['company_id'] as string) || 
        (searchParams['experience_id'] as string);

    // 2. Run Verify Logic with Fallback
    const user = await verifyUser(companyId);

    // 3. Pass result to Client
    return <HomeClient user={user} />;
}