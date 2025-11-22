import { WhopApp } from "@whop/react/components";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from 'next/headers';
import WhopSDK from '@whop/sdk';

export const metadata: Metadata = {
  title: "ApexDM Score",
  description: "Admin and Member Dashboard",
};

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default async function RootLayout({ 
  children,
  params,
}: {
  children: React.ReactNode;
  params: { experienceId?: string, companyId?: string };
}) {
  
  // --- SERVER-SIDE AUTHENTICATION ---
  let verifiedUserId: string | undefined;
  let experienceId: string | undefined;

  // Attempt to get the necessary IDs from dynamic route segments (URL parameters)
  // Whop injects the experienceId and companyId into the URL path when hosting.
  experienceId = params?.experienceId || params?.companyId; 

  // Check for the user token injected by the Whop proxy/server headers
  try {
    // ⚠️ NOTE: Ensure your WHOP_API_KEY and NEXT_PUBLIC_APP_URL are set in Vercel
    const whopsdk = new WhopSDK({ 
      apiKey: process.env.WHOP_API_KEY!, 
      baseURL: process.env.NEXT_PUBLIC_APP_URL! 
    });
    
    // Attempt to verify the token from Next.js headers
    const { userId } = await whopsdk.verifyUserToken(await headers());
    verifiedUserId = userId;
  } catch (e) {
    // If verification fails (no token, expired token, etc.), verifiedUserId remains undefined.
    // The client-side provider will handle the "GUEST" state.
    console.error("Layout token verification failed:", e);
  }
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WhopApp>
          {/* PASS THE VERIFIED ID AND EXPERIENCE CONTEXT TO THE PROVIDER */}
          <AppProvider 
            verifiedUserId={verifiedUserId || 'GUEST'} 
            experienceId={experienceId || 'no_experience'}
          >
            {children}
          </AppProvider>
        </WhopApp>
      </body>
    </html>
  );
}