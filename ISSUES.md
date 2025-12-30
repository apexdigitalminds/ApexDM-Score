# ApexDM Score - Issue Tracker

> **Workflow**: Test in Whop production → Report issue here → I analyze → You approve fix → Apply → Push to main → Verify in production

---

## Open Issues

| # | Issue | Priority | Status | Files Affected |
|---|-------|----------|--------|----------------|
| 1 | Clicking the Dashboard header menu produces 404 (Note: link to dashboard off pricing page works fine) | High | ✅ RESOLVED (2025-12-30) | Layout.tsx, AppContext.tsx, PricingPage.tsx, api.ts |
| 2 | Free account cannot update profile (No community context error) (Note: may be due to incognito browser) | High | ✅ RESOLVED (2025-12-30) | Same fix as Issue 1 |
| 3 | Pricing page background does not match other pages (Note: may be due to incognito browser) | Medium | Open | TBD |
| 4 | Free plan offer/testing gating logic: Core level restriction prevents full testing; considering Elite for Free but Supabase limits to one tier | High | Open | TBD |
| 5 | Check how the community name and whop_store_id is obtained to ensure correct recording | High | Open | TBD |
| 6 | Check the logic around how free trial is meant to work | High | Open | TBD |
| 7 | Consider restructuring the pricing for launch | Medium | Open | TBD |

## In Progress

| # | Issue | Priority | Status | Files Affected |
|---|-------|----------|--------|----------------|
| - | - | - | - | - |

---

## Resolved

| # | Issue | Resolution | Date |
|---|-------|------------|------|
| - | - | - | - |

---

## How to Report an Issue

When you encounter a problem during testing, provide:

1. **What you did** (e.g., "Clicked Dashboard in nav menu")
2. **What you expected** (e.g., "Dashboard page should load")
3. **What happened** (e.g., "Got 404 page not found error")
4. **Screenshot/URL if possible**

I'll then investigate, find the root cause, and propose a fix for your review.
