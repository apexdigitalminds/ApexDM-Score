import WhopAPI from "@whop/sdk"; // FIX: Removed curly braces to use default import

export const whop = new WhopAPI({
  apiKey: process.env.WHOP_DEV_MOCK_TOKEN || "",
});