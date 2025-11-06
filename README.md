<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# ApexDM Score - Whop-Native Gamification Platform

A gamified engagement dashboard for Whop communities. Reward members with XP, badges, and streaks to boost engagement and retention.

## Architecture

This app uses **Whop-native authentication** and is designed to be embedded in Whop experiences and company dashboards.

### Routes
- `/experiences/:experienceId` - Member dashboard (embedded in Whop experiences)
- `/dashboard/:companyId` - Admin analytics (for Whop company admins)

### Authentication
The app automatically authenticates users via the `x-whop-user-token` header injected by Whop's iframe. No login screens or OAuth flows required.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables in `.env.local`:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

4. Test routes:
   - Member: `http://localhost:3000/#/experiences/exp_test123`
   - Admin: `http://localhost:3000/#/dashboard/biz_test123`

## Backend Requirements

The front-end expects these backend endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bootstrap?experienceId={id}` | GET | Fetch user profile and game data |
| `/api/actions/record` | POST | Record user actions and award XP |
| `/api/admin/metrics?companyId={id}` | GET | Fetch admin analytics |

All requests must include the `x-whop-user-token` header for authentication.

## Migration Notes

See [WHOP_MIGRATION.md](./WHOP_MIGRATION.md) for details on the OAuth removal and Whop-native authentication implementation.

### Deprecated Components (No Longer Used)
- `LoginPage.tsx`, `SignUpPage.tsx`, `LandingPage.tsx`
- `ProtectedRoute.tsx`, `AdminRoute.tsx`
- `WhopConnectPage.tsx`

These files remain in the project for reference but are not included in the new routing structure.
