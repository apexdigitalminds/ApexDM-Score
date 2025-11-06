# Architecture Overview

## System Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         WHOP PLATFORM                            │
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────┐        │
│  │  Experience      │              │  Company         │        │
│  │  (Member View)   │              │  Dashboard       │        │
│  │                  │              │  (Admin View)    │        │
│  │  Injects:        │              │  Injects:        │        │
│  │  x-whop-user-    │              │  x-whop-user-    │        │
│  │  token (member)  │              │  token (admin)   │        │
│  └────────┬─────────┘              └────────┬─────────┘        │
│           │                                 │                   │
└───────────┼─────────────────────────────────┼───────────────────┘
            │                                 │
            ▼                                 ▼
┌───────────────────────────────────────────────────────────────────┐
│                    YOUR FRONTEND (Vite/React)                      │
│                                                                     │
│  ┌──────────────────────┐          ┌─────────────────────┐       │
│  │  MemberDashboard     │          │  AdminDashboard     │       │
│  │  /experiences/:id    │          │  /dashboard/:id     │       │
│  │                      │          │                     │       │
│  │  - XP Progress       │          │  - Total Members    │       │
│  │  - Streak Counter    │          │  - Active Members   │       │
│  │  - Badges Display    │          │  - Weekly Actions   │       │
│  │  - Trial Banner      │          │  - Trial Status     │       │
│  │  - Test Actions      │          │  - Engagement Stats │       │
│  └──────────┬───────────┘          └──────────┬──────────┘       │
│             │                                  │                  │
│             └───────────┬──────────────────────┘                  │
│                         │                                         │
│                         ▼                                         │
│              ┌──────────────────────┐                            │
│              │   services/whopApi   │                            │
│              │                      │                            │
│              │  Auto-injects:       │                            │
│              │  x-whop-user-token   │                            │
│              │                      │                            │
│              │  Methods:            │                            │
│              │  - bootstrap()       │                            │
│              │  - recordAction()    │                            │
│              │  - getMetrics()      │                            │
│              └──────────┬───────────┘                            │
│                         │                                         │
└─────────────────────────┼─────────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────────────┐
│                    YOUR BACKEND (Node/Deno)                        │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Endpoints:                                                 │  │
│  │                                                             │  │
│  │  GET  /api/bootstrap?experienceId={id}                     │  │
│  │       → Validates token                                     │  │
│  │       → Fetches user profile from Supabase                  │  │
│  │       → Returns: { id, username, xp, streak, badges, ... } │  │
│  │                                                             │  │
│  │  POST /api/actions/record                                  │  │
│  │       → Validates token                                     │  │
│  │       → Updates user XP in Supabase                         │  │
│  │       → Checks streaks, level-ups                           │  │
│  │       → Returns: { success, newXp, ... }                    │  │
│  │                                                             │  │
│  │  GET  /api/admin/metrics?companyId={id}                    │  │
│  │       → Validates admin token                               │  │
│  │       → Aggregates analytics from Supabase                  │  │
│  │       → Returns: { totalMembers, activeMembers, ... }       │  │
│  └────────────────────┬───────────────────────────────────────┘  │
│                       │                                           │
└───────────────────────┼───────────────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────────────┐
│                      SUPABASE DATABASE                             │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   profiles      │  │   badges     │  │   quests     │        │
│  │                 │  │              │  │              │        │
│  │ • whop_user_id  │  │ • name       │  │ • title      │        │
│  │ • xp            │  │ • icon       │  │ • tasks      │        │
│  │ • streak        │  │ • color      │  │ • xp_reward  │        │
│  │ • badges[]      │  │ • description│  │ • is_active  │        │
│  └─────────────────┘  └──────────────┘  └──────────────┘        │
│                                                                     │
│  ┌─────────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │  actions_log    │  │ store_items  │  │ communities  │        │
│  │                 │  │              │  │              │        │
│  │ • user_id       │  │ • name       │  │ • whop_store │        │
│  │ • action_type   │  │ • cost_xp    │  │ • tier       │        │
│  │ • xp_gained     │  │ • icon       │  │ • name       │        │
│  │ • timestamp     │  │ • is_active  │  │              │        │
│  └─────────────────┘  └──────────────┘  └──────────────┘        │
└───────────────────────────────────────────────────────────────────┘
```

## Authentication Flow

```
┌──────┐     ┌──────┐     ┌──────────┐     ┌──────────┐
│ User │────▶│ Whop │────▶│ Frontend │────▶│ Backend  │
└──────┘     └──────┘     └──────────┘     └──────────┘
              │                │                  │
              │ Inject Token   │                  │
              │───────────────▶│                  │
              │                │ Pass Token       │
              │                │─────────────────▶│
              │                │                  │
              │                │ Validate & Query │
              │                │◀─────────────────│
              │                │                  │
              │ Display Data   │                  │
              │◀───────────────│                  │
```

## Key Changes from Old Architecture

### Before (OAuth)
```
User → Landing Page → Login Page → OAuth Flow → Supabase Auth → Dashboard
       (Manual)       (Manual)     (Complex)     (Sessions)
```

### After (Whop-Native)
```
User → Whop Iframe → Auto Token → Backend → Dashboard
       (Automatic)   (Automatic)  (Simple)   (Immediate)
```

## Data Flow Examples

### 1. Member Views Dashboard
```
1. User opens Whop experience
2. Whop injects x-whop-user-token
3. Frontend calls: GET /api/bootstrap?experienceId=exp_123
4. Backend validates token → queries Supabase
5. Returns: { xp: 1250, streak: 7, badges: [...] }
6. Frontend renders MemberDashboard with data
```

### 2. Member Records Action
```
1. User clicks "+5 XP Test Action"
2. Frontend calls: POST /api/actions/record
   Body: { experienceId, actionType: "test_action", xp: 5 }
3. Backend validates token → updates Supabase
4. Returns: { success: true, newXp: 1255 }
5. Frontend refreshes profile data
6. UI updates with new XP value
```

### 3. Admin Views Metrics
```
1. Admin opens Whop company dashboard
2. Whop injects admin x-whop-user-token
3. Frontend calls: GET /api/admin/metrics?companyId=biz_123
4. Backend validates admin token → aggregates Supabase data
5. Returns: { totalMembers: 1547, activeMembers: 892, ... }
6. Frontend renders AdminDashboard with analytics
```

## Security Model

### Token Validation (Backend)
```javascript
// 1. Extract token from header
const token = req.headers['x-whop-user-token'];

// 2. Validate with Whop API
const whopUser = await fetch('https://api.whop.com/v1/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});

// 3. Check user exists in your database
const user = await supabase
  .from('profiles')
  .select('*')
  .eq('whop_user_id', whopUser.id)
  .single();

// 4. Verify permissions (for admin routes)
if (isAdminRoute && user.role !== 'admin') {
  return res.status(403).json({ error: 'Forbidden' });
}

// 5. Process request
```

## Environment Setup

### Frontend (.env.local)
```env
VITE_SUPABASE_URL=https://xyz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

### Backend (.env)
```env
SUPABASE_URL=https://xyz.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGci...
WHOP_API_KEY=whop_sk_...
```

## Deployment

### Frontend
- Deploy to Vercel/Netlify/Cloudflare Pages
- Set environment variables
- Point Whop iframe URLs to:
  - Member: `https://your-app.com/#/experiences/:experienceId`
  - Admin: `https://your-app.com/#/dashboard/:companyId`

### Backend
- Deploy to Vercel/Railway/Fly.io
- Set environment variables
- Ensure CORS allows Whop iframe origin
- Configure webhook endpoints for Whop events
