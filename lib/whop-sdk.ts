import WhopSDK from "@whop/sdk";

export const whopsdk = new WhopSDK({
  // Identifies your app
  appID: process.env.NEXT_PUBLIC_WHOP_APP_ID,
  
  // Authenticates your server-side requests
  apiKey: process.env.WHOP_API_KEY,
  
  // Defines your app's production URL (Critical for redirects)
  baseURL: process.env.NEXT_PUBLIC_APP_URL,
  
  // Handles webhook security (preserves your existing btoa logic)
  webhookKey: process.env.WHOP_WEBHOOK_SECRET 
    ? btoa(process.env.WHOP_WEBHOOK_SECRET) 
    : undefined,
});