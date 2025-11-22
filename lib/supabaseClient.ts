import { createClient } from "@supabase/supabase-js";
import type { Action } from "@/types"; // FIX: Added import for the 'Action' type

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
export function normalizeAction(row: any): Action {
  return {
    id: row.id,
    userId: row.user_id,
    communityId: row.community_id,
    actionType: row.action_type,
    xpGained: row.xp_gained,
    source: row.source,
    createdAt: row.created_at,
  };
}