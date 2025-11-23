import { WhopApp } from "@whop/react/components";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from 'next/headers';
// FIX: Import the configured SDK instance instead of creating a new incomplete one
import { whopsdk } from "@/lib/whop-sdk"; 

export const metadata: Metadata = {
  title: "ApexDM Score",
  description: "Admin and Member Dashboard",
};

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default async function RootLayout({ 
  children,
}: {
  children: React.ReactNode;
}) {
  
  // --- SERVER-SIDE AUTHENTICATION ---
  let verifiedUserId: string | undefined;
  const experienceId = "no_experience"; 

  try {
    // Use the robust SDK instance (with App ID and API Key)
    const { userId } = await whopsdk.verifyUserToken(await headers());
    verifiedUserId = userId;
    console.log("✅ Server Auth Success for:", userId);
  } catch (e) {
    console.error("❌ Server Auth Failed:", e);
    // If verifiedUserId stays undefined, the client will be GUEST
  }
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WhopApp>
          <AppProvider 
            verifiedUserId={verifiedUserId || 'GUEST'} 
            experienceId={experienceId}
          >
            {children}
          </AppProvider>
        </WhopApp>
      </body>
    </html>
  );
}