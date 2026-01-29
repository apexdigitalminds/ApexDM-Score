# CommunityXP Quick Reference Card

## Member Actions & Default XP

| Action | XP | Trigger |
|--------|---:|---------|
| Daily Login | 10 | First visit each day |
| Chat Message | 5 | Synced from Whop |
| Forum Post | 5 | Synced from Whop |
| Start Course | 25 | Synced from Whop |
| Complete Lesson | 50 | Synced from Whop |
| Complete Course | 100 | Synced from Whop |
| Subscription Renewal | 200 | Webhook |
| 7-Day Streak | 50 | Auto-triggered |
| 30-Day Streak | 150 | Auto-triggered |

---

## Badge Triggers

| Badge | Type | Requirement |
|-------|------|-------------|
| XP Novice | XP | 100 XP |
| XP Adept | XP | 1,000 XP |
| XP Veteran | XP | 5,000 XP |
| XP Master | XP | 10,000 XP |
| 3 Day Streak | Streak | 3 days |
| 7 Day Streak | Streak | 7 days |
| 30 Day Streak | Streak | 30 days |
| Century Club | Streak | 100 days |

---

## Level Formula

```
Level = floor(XP / 100)
```

| Level | XP Required |
|------:|------------:|
| 1 | 100 |
| 5 | 500 |
| 10 | 1,000 |
| 50 | 5,000 |
| 100 | 10,000 |

---

## Streak Rules

- **Increment**: Login 1 calendar day after last login (UTC)
- **Maintain**: Can't increase more than 1/day
- **Reset**: Miss 2+ calendar days
- **Freeze**: Auto-consumed if you miss exactly 1 day

---

## Store Items (Defaults)

| Item | Cost | Effect |
|------|-----:|--------|
| XP Boost | 150 XP | 1.5x XP for 24h |
| Streak Shield | 300 XP | +1 streak freeze |
| Golden Frame | 500 XP | Profile cosmetic |
| VIP Title | 750 XP | Profile title |
| Diamond Badge | 1,000 XP | Avatar effect |

---

## Admin Quick Actions

| Task | Location |
|------|----------|
| Edit member XP | Admin → Members → Edit |
| Create quest | Admin → Quests → Create |
| Add reward action | Admin → Rewards → Add |
| Configure badge | Admin → Badges → Edit |
| White-label branding | Admin → Settings |
| Sync Whop activity | Dashboard → Sync |

---

## API Keys & Webhooks

| Service | Purpose |
|---------|---------|
| `WHOP_API_KEY` | Fetch experience/company data |
| `WHOP_APP_ID` | App identification |
| `NEXT_PUBLIC_SUPABASE_*` | Database connection |
| Webhook: `membership.went_valid` | New member provisioning |
| Webhook: `membership.went_invalid` | Subscription ended |

---

## Timezone Info

- **Streaks**: Based on UTC calendar days
- **Daily Login**: First login per UTC day
- **Sync**: Filters activity by UTC timestamps

---

## Troubleshooting Codes

| Issue | Check |
|-------|-------|
| Profile not found | `whop_user_id` + `community_id` match |
| Wrong community | Clear profile, re-provision |
| Streak reset | Check `last_action_date` in DB |
| Quest not updating | Verify `action_type` matches task |
| Badge not awarded | Check `trigger_type` and `is_active` |
| Sync failed | Verify `WHOP_API_KEY` and `experience_id` |
