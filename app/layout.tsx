// app/layout.tsx (Final, Corrected Structure)

import { WhopApp } from "@whop/react/components";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from 'next/headers';
import WhopSDK from '@whop/sdk'; // Default import fixed previously

export const metadata: Metadata = { /* ... */ };
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

// 1. RootLayout must only accept 'children' for the function signature
export default async function RootLayout({ 
  children,
}: {
  children: React.ReactNode;
}) {
  
  // --- SERVER-SIDE AUTHENTICATION ---
  let verifiedUserId: string | undefined;
  // Layout cannot reliably determine experienceId, so we use a safe fallback.
  const experienceId = "no_experience"; 

  try {
    const whopsdk = new WhopSDK({ 
      apiKey: process.env.WHOP_API_KEY!, 
      baseURL: process.env.NEXT_PUBLIC_APP_URL! 
    });
    
    // Check for the token injected by Whop proxy
    const { userId } = await whopsdk.verifyUserToken(await headers());
    verifiedUserId = userId;
  } catch (e) {
    // If verification fails, verifiedUserId remains undefined.
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