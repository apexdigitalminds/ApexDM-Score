# Whop-Native Authentication Migration

This document outlines the changes made to migrate from OAuth to Whop-native authentication.

## Key Changes

### 1. Removed OAuth Components
- ✅ Deleted `LoginPage.tsx`, `SignUpPage.tsx`, `LandingPage.tsx`
- ✅ Removed `ProtectedRoute.tsx` and `AdminRoute.tsx` (no longer needed)
- ✅ Removed all OAuth-related logic from `App.tsx`
- ✅ Removed `WhopConnectPage.tsx` (replaced with automatic authentication)

### 2. New API Layer
Created `services/whopApi.ts` with:
- Automatic `x-whop-user-token` header injection
- Mock token support for local development
- Error handling with toast notifications
- Clean API methods: `bootstrap()`, `recordAction()`, `getMetrics()`

### 3. New Route Structure
```
/experiences/:experienceId  → Member view (embedded in Whop experience)
/dashboard/:companyId       → Admin view (for Whop company admins)
```

### 4. New Components
- `MemberDashboard.tsx` - User-facing dashboard with XP, streaks, badges
- `AdminDashboard.tsx` - Admin analytics and metrics view
- `TrialBanner.tsx` - Displays trial expiration and upgrade CTA

### 5. Backend Integration
The app now expects these backend endpoints:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/bootstrap?experienceId={id}` | GET | Fetch user profile, XP, badges, etc. |
| `/api/actions/record` | POST | Record user actions and award XP |
| `/api/admin/metrics?companyId={id}` | GET | Admin analytics and metrics |

### 6. Environment Variables
**Keep only:**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Removed:**
- `VITE_WHOP_CLIENT_ID`
- `VITE_BACKEND_URL` (if not used elsewhere)

## How It Works

### Member Experience Flow
1. User accesses app through Whop experience iframe at `/experiences/:experienceId`
2. Whop automatically injects `x-whop-user-token` header
3. App calls `/api/bootstrap` with the token to fetch user data
4. User sees their dashboard with XP, streaks, badges, and quests
5. User actions are recorded via `/api/actions/record`

### Admin Dashboard Flow
1. Admin accesses app from Whop company dashboard at `/dashboard/:companyId`
2. Token identifies admin permissions automatically
3. App calls `/api/admin/metrics` to fetch analytics
4. Admin sees community metrics, engagement data, and subscription status

## Local Development

For local testing without Whop:
```typescript
// services/whopApi.ts uses a mock token in dev mode
const MOCK_TOKEN = 'mock_dev_token_12345';
```

Console warning will appear: `⚠️ Missing Whop token — using mock user for local dev.`

## Deployment Checklist

- [ ] Deploy backend with `/api/bootstrap`, `/api/actions/record`, `/api/admin/metrics` endpoints
- [ ] Ensure backend validates `x-whop-user-token` header
- [ ] Configure Supabase tables: `profiles`, `actions_log`, `badges`, `quests`, etc.
- [ ] Test member view: `/experiences/:experienceId`
- [ ] Test admin view: `/dashboard/:companyId`
- [ ] Verify trial/subscription logic displays correctly
- [ ] Remove old OAuth redirect URIs from Whop app settings

## Database Schema

The app continues to use Supabase with:
- `profiles.whop_user_id` - Whop user identifier
- `communities.whop_store_id` - Whop company identifier
- `actions_log` - XP history tracking
- `badges`, `quests`, `store_items` - Gamification data

## Testing

**Member View:**
```
http://localhost:3000/#/experiences/exp_test123
```

**Admin View:**
```
http://localhost:3000/#/dashboard/biz_test123
```

Both routes will work with mock authentication in development mode.
