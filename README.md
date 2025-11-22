# ApexDM Score 🚀

**ApexDM Score** is a B2B SaaS Gamification System designed for Whop Communities. It allows creators to boost retention through XP, Badges, Quests, and a Rewards Store.

## 📚 Tech Stack
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript (Strict)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Auth & Payments:** Whop OAuth + SDK

---

## 🛠️ Quick Start (Local Dev)

1. **Clone & Install**
   ```bash
   git clone [your-repo-url]
   cd ApexDM-Score
   npm install
Environment VariablesCreate a .env.local file in the root:Code snippet# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# Whop (Developer Dashboard)
WHOP_API_KEY=your_whop_api_key
WHOP_CLIENT_ID=your_oauth_client_id
WHOP_CLIENT_SECRET=your_oauth_client_secret
NEXT_PUBLIC_WHOP_REDIRECT_URI=http://localhost:3000/api/auth/callback
Run ServerBashnpm run dev
Feature,Core ($59),Pro ($99),Elite ($159)
XP & Levels,✅,✅,✅
Badges,✅,✅,✅
Leaderboards,✅,✅,✅
Manual Awards,✅,✅,✅
Unlimited Users,✅,✅,✅
Analytics Dashboard,❌,✅,✅
Quests System,❌,✅,✅
Seasonal Boards,❌,✅,✅
Discord Sync,❌,🚧 (Soon),✅
XP Store,❌,❌,✅
White Labeling,❌,❌,✅

Note: Tiers are enforced in context/AppContext.tsx via the isFeatureEnabled() function.

⚡ Database Schema & FunctionsIf you need to reset the database or deploy to a new project, run this SQL script in the Supabase SQL Editor.1. Core SchemaSQL-- Communities
CREATE TABLE IF NOT EXISTS communities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo_url TEXT,
    subscription_tier TEXT DEFAULT 'Free',
    trial_ends_at TIMESTAMPTZ,
    white_label_enabled BOOLEAN DEFAULT FALSE
);

-- Profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    community_id UUID REFERENCES communities(id),
    username TEXT,
    avatar_url TEXT,
    xp INTEGER DEFAULT 0,
    streak INTEGER DEFAULT 0,
    streak_freezes INTEGER DEFAULT 0,
    last_action_date DATE,
    role TEXT DEFAULT 'member'
);

-- Store & Inventory
CREATE TABLE IF NOT EXISTS store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id UUID REFERENCES communities(id),
    name TEXT,
    cost_xp INTEGER DEFAULT 0,
    item_type TEXT DEFAULT 'INSTANT',
    is_active BOOLEAN DEFAULT TRUE,
    is_archived BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id),
    item_id UUID REFERENCES store_items(id),
    community_id UUID REFERENCES communities(id),
    is_active BOOLEAN DEFAULT FALSE
);
2. Critical Functions (RPC)These functions handle logic that the frontend cannot do safely (e.g. subtracting XP).Buy Item:SQLCREATE OR REPLACE FUNCTION buy_store_item(p_user_id UUID, p_item_id UUID)
RETURNS JSON SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_xp_cost INT; v_user_xp INT; v_comm_id UUID;
BEGIN
  SELECT cost_xp, community_id INTO v_xp_cost, v_comm_id FROM store_items WHERE id = p_item_id;
  SELECT xp INTO v_user_xp FROM profiles WHERE id = p_user_id;
  
  IF v_user_xp < v_xp_cost THEN
    RETURN json_build_object('success', false, 'message', 'Insufficient XP.');
  END IF;

  UPDATE profiles SET xp = xp - v_xp_cost WHERE id = p_user_id;
  INSERT INTO user_inventory (user_id, item_id, community_id, is_active) VALUES (p_user_id, p_item_id, v_comm_id, FALSE);
  
  RETURN json_build_object('success', true, 'message', 'Item purchased!');
END;
$$ LANGUAGE plpgsql;
Activate Item:SQLCREATE OR REPLACE FUNCTION activate_inventory_item(p_inventory_id UUID)
RETURNS JSON SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE user_inventory SET is_active = TRUE WHERE id = p_inventory_id;
  RETURN json_build_object('success', true, 'message', 'Item activated!');
END;
$$ LANGUAGE plpgsql;
3. Permissions (RLS Fix)If features fail silently, run this "Nuclear Option" to reset permissions:SQLALTER TABLE communities DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
🚀 Deployment ChecklistBuild Check: Run npm run build. Ensure 0 errors.Deploy: Push to Vercel.Config: Add Environment Variables in Vercel Project Settings.Whop Config: Update the App URL in Whop Developer Dashboard to your Vercel URL (https://your-app.vercel.app).