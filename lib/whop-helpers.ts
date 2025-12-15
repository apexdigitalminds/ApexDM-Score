/**
 * Whop Integration Helper Functions
 * 
 * These functions handle the critical task of resolving company_id from experienceId.
 * Whop does NOT include company_id in JWT tokens, so we must fetch it via API.
 */

/**
 * Fetches the company_id for a given experienceId by calling Whop's API.
 * This is the canonical way to get company context in Whop apps.
 * 
 * @param experienceId - The experience ID from the URL (e.g., "exp_xxxxx")
 * @returns The company_id (e.g., "comp_xxxxx") or null if not found
 */
export async function getCompanyIdFromExperience(
  experienceId: string
): Promise<string | null> {
  try {
    console.log(`🔍 Fetching company for experience: ${experienceId}`);
    
    if (!process.env.WHOP_API_KEY) {
      console.error("❌ WHOP_API_KEY not configured");
      return null;
    }
    
    // 🟢 CORRECT ENDPOINT: /v5/app/experiences (note the /app/ prefix)
    const response = await fetch(
      `https://api.whop.com/api/v5/app/experiences/${experienceId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHOP_API_KEY}`,
          "Content-Type": "application/json",
        },
        cache: "no-store", // Always get fresh data
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Whop API Error [${response.status}]:`, errorText);
      
      // More specific error messages
      if (response.status === 404) {
        console.error(`   Experience not found: ${experienceId}`);
        console.error(`   This usually means:`);
        console.error(`   1. The experienceId is invalid or expired`);
        console.error(`   2. The experience was deleted`);
        console.error(`   3. Your WHOP_API_KEY doesn't have access to this experience`);
      } else if (response.status === 401) {
        console.error(`   Unauthorized - check your WHOP_API_KEY`);
      }
      
      return null;
    }

    const data = await response.json();
    
    // 🟢 CORRECT STRUCTURE: company_id is a direct field, not nested
    console.log(`📦 Experience API Response:`, {
      id: data.id,
      name: data.name,
      company_id: data.company_id,
      app_id: data.app_id,
      access_level: data.access_level,
    });
    
    const companyId = data.company_id;
    
    if (companyId) {
      console.log(`✅ Resolved company_id: ${companyId}`);
      return companyId;
    }

    console.error("❌ No company_id found in experience response");
    console.error("   Full response:", JSON.stringify(data, null, 2));
    return null;
    
  } catch (error: any) {
    console.error("❌ Error fetching company from experience:", error.message);
    console.error("   Stack:", error.stack);
    return null;
  }
}