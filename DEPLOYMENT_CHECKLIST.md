# Deployment Checklist

Use this checklist when deploying your Whop-native gamification platform.

## Pre-Deployment

### Frontend Setup
- [ ] Environment variables configured:
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] Remove old OAuth-related environment variables
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors
- [ ] Test routes work locally:
  - [ ] `/experiences/exp_test123`
  - [ ] `/dashboard/biz_test123`

### Backend Setup
- [ ] Backend endpoints implemented:
  - [ ] `GET /api/bootstrap?experienceId={id}`
  - [ ] `POST /api/actions/record`
  - [ ] `GET /api/admin/metrics?companyId={id}`
- [ ] Token validation implemented
- [ ] Supabase connection configured
- [ ] CORS configured for Whop iframe
- [ ] Error handling returns proper format: `{ ok: false, error, message }`

### Database Setup
- [ ] Supabase project created
- [ ] Tables exist:
  - [ ] `profiles` with `whop_user_id` column
  - [ ] `communities` with `whop_store_id` column
  - [ ] `actions_log`
  - [ ] `badges`
  - [ ] `quests`
  - [ ] `store_items`
- [ ] Row Level Security (RLS) policies configured
- [ ] Test data seeded for development

## Deployment

### Frontend Deployment
- [ ] Deploy to hosting platform (Vercel/Netlify/Cloudflare)
- [ ] Set production environment variables
- [ ] Verify build completes successfully
- [ ] Test deployed URLs:
  - [ ] `https://your-app.com/#/experiences/exp_test`
  - [ ] `https://your-app.com/#/dashboard/biz_test`

### Backend Deployment
- [ ] Deploy to server (Vercel/Railway/Fly.io)
- [ ] Set production environment variables
- [ ] Verify API endpoints respond:
  - [ ] `curl https://your-api.com/api/bootstrap?experienceId=exp_test`
  - [ ] Test with valid Whop token
- [ ] Check logs for errors

### Whop Configuration
- [ ] Create or update Whop app
- [ ] Set iframe URLs in Whop dashboard:
  - [ ] Member experience: `https://your-app.com/#/experiences/{experience_id}`
  - [ ] Admin dashboard: `https://your-app.com/#/dashboard/{company_id}`
- [ ] Configure webhooks (if applicable):
  - [ ] Subscription created
  - [ ] Subscription renewed
  - [ ] Subscription cancelled
- [ ] Remove old OAuth redirect URIs

## Testing

### Member Experience
- [ ] Navigate to your Whop experience
- [ ] Verify app loads without login screen
- [ ] Check "Authenticating with Whop..." appears briefly
- [ ] Dashboard loads with correct user data
- [ ] XP progress bar displays correctly
- [ ] Streak counter shows accurate data
- [ ] Badges render properly
- [ ] Trial banner appears (if applicable)
- [ ] Test action button works (for admins)

### Admin Dashboard
- [ ] Navigate to Whop company dashboard
- [ ] Open your app's admin view
- [ ] Verify metrics load correctly:
  - [ ] Total members count
  - [ ] Active members count
  - [ ] Weekly actions count
  - [ ] Total XP awarded
- [ ] Engagement chart displays
- [ ] Subscription status shows correctly
- [ ] Trial banner appears (if applicable)

### API Functionality
- [ ] Record action from member view
- [ ] Verify XP updates in real-time
- [ ] Check streak increments daily
- [ ] Verify badges are awarded correctly
- [ ] Test with multiple users
- [ ] Test admin-only features

### Error Handling
- [ ] Test with invalid token
- [ ] Test with expired token
- [ ] Test with missing experienceId/companyId
- [ ] Verify error messages display to user
- [ ] Check backend logs for errors

## Post-Deployment

### Monitoring
- [ ] Set up error tracking (Sentry/LogRocket)
- [ ] Monitor API response times
- [ ] Track user engagement metrics
- [ ] Set up alerts for:
  - [ ] API errors
  - [ ] High response times
  - [ ] Failed builds

### Documentation
- [ ] Update README with production URLs
- [ ] Document any environment-specific config
- [ ] Share API documentation with team
- [ ] Create user guide (if needed)

### Optimization
- [ ] Review bundle size: `npm run build`
- [ ] Optimize images and assets
- [ ] Enable CDN for static files
- [ ] Configure caching headers

## Troubleshooting

### Common Issues

**"Authenticating with Whop..." never completes**
- Check backend `/api/bootstrap` endpoint
- Verify token is being sent in headers
- Check backend logs for errors
- Ensure Supabase connection is working

**"Failed to load profile" error**
- Verify user exists in Supabase `profiles` table
- Check `whop_user_id` matches token user ID
- Ensure RLS policies allow read access
- Check backend logs for SQL errors

**Admin dashboard shows "Failed to load metrics"**
- Verify user has `role = 'admin'` in database
- Check `/api/admin/metrics` endpoint implementation
- Verify `companyId` parameter is correct
- Check for database query errors

**Trial banner not appearing**
- Verify `/api/bootstrap` returns `trialEndsAt` field
- Check `isActiveSubscription` is `false`
- Ensure date is in future
- Check component logic in `TrialBanner.tsx`

**XP not updating after action**
- Verify `/api/actions/record` endpoint works
- Check token validation is passing
- Ensure database update succeeds
- Verify frontend refreshes data after action

## Rollback Plan

If deployment fails:
1. Revert frontend deployment to previous version
2. Revert backend deployment to previous version
3. Check error logs for root cause
4. Fix issues in development
5. Re-run deployment checklist

## Success Criteria

Deployment is successful when:
- [ ] All users can access app through Whop
- [ ] Authentication works without manual login
- [ ] All features work as expected
- [ ] No critical errors in logs
- [ ] Performance is acceptable (< 2s load time)
- [ ] Trial/subscription logic works correctly

## Next Steps After Deployment

1. Monitor for 24 hours
2. Gather user feedback
3. Track engagement metrics
4. Plan feature iterations
5. Set up A/B testing (if needed)

---

**Deployment Date:** _______________
**Deployed By:** _______________
**Version:** _______________
**Notes:** _______________
