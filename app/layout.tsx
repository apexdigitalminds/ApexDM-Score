import { WhopApp } from "@whop/react/components";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from 'next/headers';
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
  let verifiedRole: "admin" | "member" = "member"; 
  const experienceId = "no_experience"; 

  try {
    // 🟢 FIX: Cast to 'any' to access 'roles' property if TS definition is missing it
    const tokenPayload = await whopsdk.verifyUserToken(await headers()) as any;
    verifiedUserId = tokenPayload.userId;
    const roles = tokenPayload.roles || [];

    // Check if user is Owner, Admin, or Staff
    const isAdmin = roles.some((r: string) => 
        ['owner', 'admin', 'staff', 'moderator'].includes(r)
    );

    if (isAdmin) {
        verifiedRole = "admin";
        console.log(`✅ User ${verifiedUserId} identified as ADMIN via Whop Roles`);
    } else {
        console.log(`✅ User ${verifiedUserId} authenticated as MEMBER`);
    }

  } catch (e) {
    console.error("❌ Server Auth Failed:", e);
  }
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WhopApp>
          <AppProvider 
            verifiedUserId={verifiedUserId || 'GUEST'} 
            experienceId={experienceId}
            verifiedRole={verifiedRole} 
          >
            {children}
          </AppProvider>
        </WhopApp>
      </body>
    </html>
  );
}