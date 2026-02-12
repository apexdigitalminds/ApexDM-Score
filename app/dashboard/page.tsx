import { redirect } from 'next/navigation';

// This page exists to satisfy the Next.js route validator.
// Users always enter via /dashboard/[companyId], so we redirect to the home page.
export default function DashboardIndex() {
    redirect('/');
}
