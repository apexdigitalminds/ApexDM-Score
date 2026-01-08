import { WhopApp } from "@whop/react/components";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from 'next/headers';
import { whopsdk } from "@/lib/whop-sdk";

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
    const payload = await whopsdk.verifyUserToken(await headers());
    const token = payload as any;
    verifiedUserId = token.userId || token.user_id; // Check snake_case too just in case
    experienceId = token.experienceId || token.experience_id || ""; // 🟢 FIX: Check both casings

    // We do NOT write to the DB here. actions.ts handles that.
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