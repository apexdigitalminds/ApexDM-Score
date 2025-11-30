import { WhopApp } from "@whop/react/components";
import { AppProvider } from "@/context/AppContext";
import "./globals.css";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { headers } from 'next/headers';
import { whopsdk } from "@/lib/whop-sdk"; 
import { supabaseAdmin } from "@/lib/supabase-admin";

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
  
  let verifiedUserId: string | undefined;
  let verifiedRole: "admin" | "member" = "member"; 
  
  // 🟢 FIX: Dynamic IDs instead of hardcoded placeholders
  let experienceId = ""; 
  let companyId = "";

  try {
    // 1. Verify Token
    const payload = await whopsdk.verifyUserToken(await headers());
    const token = payload as any; 
    
    verifiedUserId = token.userId;
    
    // 🟢 FIX: Extract Context from Token
    // Whop token usually contains these if opened inside an experience/company context
    experienceId = token.experienceId || "";
    companyId = token.companyId || "";
    
    const roles = token.roles || [];

    // 2. Determine Role
    const isAdmin = roles.some((r: string) => 
        ['owner', 'admin', 'staff', 'moderator'].includes(r)
    );
    verifiedRole = isAdmin ? "admin" : "member";

    // 3. Secure Role Sync
    if (verifiedUserId) {
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('role')
            .eq('id', verifiedUserId)
            .single();
            
        if (profile && profile.role !== verifiedRole) {
            console.log(`🔄 Syncing Role for ${verifiedUserId}: ${profile.role} -> ${verifiedRole}`);
            await supabaseAdmin
                .from('profiles')
                .update({ role: verifiedRole })
                .eq('id', verifiedUserId);
        }
    }
    
    console.log(`✅ Auth Success: ${verifiedUserId} (${verifiedRole}) Exp: ${experienceId}`);

  } catch (e) {
    console.error("❌ Server Auth Failed (Layout):", e);
  }
  
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WhopApp>
          <AppProvider 
            verifiedUserId={verifiedUserId || 'GUEST'} 
            experienceId={experienceId || 'no_experience'} // Fallback only if truly missing
            verifiedRole={verifiedRole} 
          >
            {children}
          </AppProvider>
        </WhopApp>
      </body>
    </html>
  );
}