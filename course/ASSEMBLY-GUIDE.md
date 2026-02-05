# Whop Course Assembly Guide

> **How to upload the course content to Whop**

---

## Quick Reference

| File | Whop Location |
|------|---------------|
| `00-start-here.md` | Content App → "Start Here" page |
| `module-1-*.md` | Courses App → Module 1 |
| `module-2-*.md` | Courses App → Module 2 |
| `module-3-*.md` | Courses App → Module 3 |
| `module-4-*.md` | Courses App → Module 4 |
| `module-5-*.md` | Courses App → Module 5 |

---

## Step-by-Step Setup

### 1. Create a New Course

1. Open your Whop dashboard
2. Go to **Apps** → **Courses**
3. Click **Create Course**
4. Name: "The Community Loyalty Engine"
5. Description: "Transform your community from passive to active. Learn engagement psychology and set up CommunityXP."
6. Access: **Free** (or linked to free product tier)

### 2. Create Modules

Create 5 modules in this order:

| Module | Name |
|--------|------|
| 1 | The Engagement Crisis |
| 2 | The Psychology of Engagement |
| 3 | Building Your XP System |
| 4 | Advanced Retention Strategies |
| 5 | The Complete Loyalty Ecosystem |

### 3. Add Lessons

For each module, the markdown content can be split into lessons matching the "Lesson X.X" headers, or kept as one long lesson per module.

**Recommended: One lesson per module** (simpler for V1 launch)

### 4. Set Up Start Page

1. Go to **Apps** → **Content**
2. Create a new page titled "Start Here"
3. Paste content from `00-start-here.md`
4. Link to the course

### 5. Add Links

Replace placeholder `[→](#)` links with actual Whop URLs for:
- CommunityXP app install page
- Elite trial signup
- Module navigation

---

## Content Formatting Notes

### Markdown → Whop

Most Whop text editors support:
- Headers (`#`, `##`, `###`)
- Bold and italic
- Bullet and numbered lists
- Tables (may need to paste as formatted)
- Blockquotes

### Images to Add (Optional)

For screenshots, capture these from your CommunityXP instance:
- Dashboard overview
- XP rules settings
- Level configuration
- Leaderboard view
- Badge display

Place screenshots in the appropriate lessons for visual reference.

---

## Suggested Course Settings

| Setting | Value |
|---------|-------|
| Drip Content | No (all available immediately) |
| Completion Tracking | Yes |
| Certificate | Optional (nice for completion proof) |
| Visibility | Public (appears in Whop marketplace) |

---

## Post-Launch Checklist

- [ ] All modules visible and accessible
- [ ] Links work (app install, trial, etc.)
- [ ] Course shows in Whop marketplace
- [ ] Test: Complete course as test user
- [ ] Promote on social media / existing channels

---

## Files Included

```
course/
├── 00-start-here.md           (Orientation page)
├── module-1-engagement-crisis.md
├── module-2-psychology-of-engagement.md
├── module-3-building-your-xp-system.md
├── module-4-advanced-retention-strategies.md
├── module-5-complete-loyalty-ecosystem.md
└── ASSEMBLY-GUIDE.md          (This file)
```

---

*Course ready for Whop upload!*
