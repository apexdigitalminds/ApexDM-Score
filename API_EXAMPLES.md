# Backend API Examples

This document shows the expected request/response formats for the backend endpoints.

## Authentication

All requests must include the Whop user token:

```http
x-whop-user-token: whop_user_abc123xyz
```

## 1. Bootstrap User Profile

**Endpoint:** `GET /api/bootstrap?experienceId={experienceId}`

**Request Headers:**
```http
GET /api/bootstrap?experienceId=exp_abc123
x-whop-user-token: whop_user_xyz789
```

**Expected Response:**
```json
{
  "id": "user-uuid-123",
  "communityId": "community-uuid-456",
  "username": "JohnDoe",
  "avatarUrl": "https://api.dicebear.com/8.x/lorelei/svg?seed=john",
  "xp": 1250,
  "streak": 7,
  "streakFreezes": 2,
  "lastActionDate": "2025-11-06",
  "role": "member",
  "whop_user_id": "whop_user_xyz789",
  "badges": [
    {
      "id": "badge-uuid-1",
      "name": "Analyst Bronze",
      "description": "Completed your first module",
      "icon": "ShieldCheck",
      "color": "#cd7f32"
    },
    {
      "id": "badge-uuid-2",
      "name": "XP Novice",
      "description": "Reached 100 XP",
      "icon": "Star",
      "color": "#c0c0c0"
    }
  ],
  "trialEndsAt": "2025-11-20T00:00:00Z",
  "isActiveSubscription": false
}
```

## 2. Record User Action

**Endpoint:** `POST /api/actions/record`

**Request:**
```http
POST /api/actions/record
x-whop-user-token: whop_user_xyz789
Content-Type: application/json

{
  "experienceId": "exp_abc123",
  "actionType": "watch_content",
  "xp": 10
}
```

**Expected Response (Success):**
```json
{
  "ok": true,
  "success": true,
  "newXp": 1260,
  "xpGained": 10,
  "streakUpdated": false,
  "newStreak": 7,
  "leveledUp": false,
  "newLevel": 3
}
```

**Expected Response (Error):**
```json
{
  "ok": false,
  "error": "Invalid action type",
  "message": "The action 'invalid_action' is not configured"
}
```

## 3. Admin Metrics

**Endpoint:** `GET /api/admin/metrics?companyId={companyId}`

**Request Headers:**
```http
GET /api/admin/metrics?companyId=biz_abc123
x-whop-user-token: whop_admin_xyz789
```

**Expected Response:**
```json
{
  "companyId": "biz_abc123",
  "totalMembers": 1547,
  "activeMembers": 892,
  "weeklyActions": 3241,
  "totalXpAwarded": 124580,
  "isActiveSubscription": true,
  "trialEndsAt": null,
  "currentTier": "pro",
  "engagement": {
    "dailyActiveUsers": 234,
    "weeklyActiveUsers": 892,
    "monthlyActiveUsers": 1203
  },
  "topActions": [
    {
      "actionType": "watch_content",
      "count": 1205,
      "totalXp": 12050
    },
    {
      "actionType": "complete_module",
      "count": 487,
      "totalXp": 12175
    }
  ]
}
```

## Error Handling

The frontend expects errors in this format:

```json
{
  "ok": false,
  "error": "Error type",
  "message": "Human-readable error message"
}
```

Common error scenarios:
- Invalid or expired token → 401 Unauthorized
- Missing experienceId/companyId → 400 Bad Request
- User not found → 404 Not Found
- User is banned → 403 Forbidden

## Frontend Error Display

When an API call fails, the frontend shows an alert with the error message:
```javascript
alert(`Error: ${errorMessage}`);
```

You can replace this with a toast library for better UX.

## Mock Token for Development

For local testing, the frontend uses:
```
x-whop-user-token: mock_dev_token_12345
```

Your backend should recognize this token in development mode and return test data.

## Token Validation

Backend should:
1. Extract `x-whop-user-token` from headers
2. Validate token with Whop API (in production)
3. Extract user ID and permissions
4. Query Supabase for user data
5. Return formatted response

Example validation flow:
```javascript
const token = req.headers['x-whop-user-token'];
if (!token) {
  return res.status(401).json({ ok: false, error: 'Missing token' });
}

// Validate with Whop API
const whopUser = await validateWhopToken(token);
if (!whopUser) {
  return res.status(401).json({ ok: false, error: 'Invalid token' });
}

// Query your database
const user = await supabase
  .from('profiles')
  .select('*')
  .eq('whop_user_id', whopUser.id)
  .single();

return res.json(user);
```
