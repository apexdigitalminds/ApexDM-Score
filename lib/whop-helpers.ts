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
    
    // Call Whop API v5 to get experience details
    const response = await fetch(
      `https://api.whop.com/api/v5/experiences/${experienceId}`,
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
      return null;
    }

    const data = await response.json();
    
    // Log the response structure for debugging
    console.log(`📦 Experience data structure:`, {
      hasCompany: !!data.company,
      companyId: data.company?.id,
      experienceId: data.id,
    });
    
    // The company_id is in data.company.id
    const companyId = data.company?.id;
    
    if (companyId) {
      console.log(`✅ Resolved company_id: ${companyId}`);
      return companyId;
    }

    console.error("❌ No company.id found in experience response");
    console.error("   Full response:", JSON.stringify(data, null, 2));
    return null;
    
  } catch (error: any) {
    console.error("❌ Error fetching company from experience:", error.message);
    return null;
  }
}