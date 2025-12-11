// app/page.tsx
// This is now a SERVER COMPONENT by default (no "use client" at top)

import { verifyUser } from './actions'; // Import the server logic directly
import HomeClient from '../app/components/HomeClient';

export default async function Page() {
    // 1. Run the Fix Logic ON THE SERVER.
    // This uses the request headers, so the Token is guaranteed to be present (if inside Whop).
    const user = await verifyUser();

    // 2. Pass the result to the Client Component
    return <HomeClient user={user} />;
}