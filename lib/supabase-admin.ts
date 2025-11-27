import { createClient } from '@supabase/supabase-js';

// ⚠️ CRITICAL: Only use this in Server Actions or API Routes.
// Never import this into a client-side component.
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, 
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);