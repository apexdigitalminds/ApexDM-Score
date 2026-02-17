import { WhopApp } from "@whop/react/components";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from 'next/headers';
import { whopsdk } from "@/lib/whop-sdk";

// 🚫 Prevent Next.js from caching this layout — auth must be fresh on every request
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "CommunityXP",
  description: "Admin and Member Dashboard",
};

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  let verifiedUserId: string | undefined;
  let verifiedRole: "admin" | "member" = "member";
  let experienceId = "";

  try {
    const hdrs = await headers();
    const payload = await whopsdk.verifyUserToken(hdrs);
    const token = payload as any;
    verifiedUserId = token.userId || token.user_id;
    experienceId = token.experienceId || token.experience_id || "";

    // 🔑 IDENTITY BLEED FIX: Override stale userId from proxy with correct one
    const correctUserId = hdrs.get('x-whop-correct-user-id');
    if (correctUserId && correctUserId !== verifiedUserId) {
      console.log(`🔑 Layout IDENTITY OVERRIDE: SDK=${verifiedUserId}, Whop=${correctUserId}`);
      verifiedUserId = correctUserId;
    }

    const roles = token.roles || [];
    verifiedRole = roles.some((r: string) =>
      ['owner', 'admin', 'staff', 'moderator'].includes(r)
    ) ? "admin" : "member";

    console.log(`✅ Layout Auth: ${verifiedUserId} (${verifiedRole})`);

  } catch (e) {
    // Silent fail in Layout to prevent blocking public pages
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WhopApp>
          <AppProvider
            verifiedUserId={verifiedUserId || 'GUEST'}
            experienceId={experienceId || 'no_experience'}
            verifiedRole={verifiedRole}
          >
            {children}
          </AppProvider>
        </WhopApp>
      </body>
    </html>
  );
}