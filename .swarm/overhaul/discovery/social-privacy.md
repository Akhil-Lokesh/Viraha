# Viraha Social Layer & Privacy Model - Discovery Report
**Generated:** June 9, 2026  
**Codebase:** Express 5 + Prisma + PostGIS backend; Next.js 14 frontend  
**Scope:** Full end-to-end analysis of social features, privacy controls, and security gaps

---

## 1. SOCIAL FEATURES - CURRENT STATE

### 1.1 Follows & Private Account Flow
**Status:** Mostly implemented, partially wired  
**Prisma Model:** `Follow` (status: 'accepted' | 'pending'), `User.isPrivate` field  

**What works:**
- Public accounts: Instant follow acceptance (`/api/v1/users/:userId/follow` → POST creates status='accepted')
- Private accounts: Auto-creates 'pending' follow request (line 57, followController.ts)
- Accept/reject flow: `/api/v1/users/me/follow-requests` endpoint (getPendingRequests)
- Block/unblock: Bidirectional follow cleanup on block (line 46-56, blockController.ts)
- Block visibility: Follows hidden from blocked/blocker pairs (getHiddenUserIds used in getFollowers/getFollowing)

**Gaps & Weaknesses:**
- **Frontend:** No UI for viewing pending follow requests or accepting/rejecting them (exists backend-only)
- **Frontend:** usePendingFollowRequests hook exists (use-follows.ts) but not connected to any page
- **checkFollowStatus API:** Returns `isFollowing: true` even when status='pending' (line 272, followController.ts) — misleading on profile pages
- **Block filtering incomplete:** getFollowers/getFollowing filter out blocker/blocked users, but albums/journals/user search don't respect blocks (per prior audits)
- **No mutual follow indicator**
- **Email notifications:** No activity emails sent for follow requests (only in-app activities exist)

**Routes wired:**
```
POST   /api/v1/users/:userId/follow          (followUser)
DELETE /api/v1/users/:userId/follow          (unfollowUser)
GET    /api/v1/users/:userId/followers       (getFollowers, optionalAuth)
GET    /api/v1/users/:userId/following       (getFollowing, optionalAuth)
GET    /api/v1/users/:userId/follow/status   (checkFollowStatus, authenticate)
GET    /api/v1/users/me/follow-requests      (getPendingRequests, authenticate)
POST   /api/v1/users/follow-requests/:followId/accept  (acceptFollowRequest, authenticate)
POST   /api/v1/users/follow-requests/:followId/reject  (rejectFollowRequest, authenticate)
```

---

### 1.2 Feed Generation
**Status:** Fully wired, algorithm: chronological with privacy awareness  
**Endpoints:** `/api/v1/feed/personal`, `/api/v1/feed/discover`

**How it works:**
- **Personal feed** (authenticated): Posts from user + accepted follows, respecting privacy levels
  - Filters: `privacy IN ('public', 'followers')` where followers has accepted follow + user's own posts
  - Ordering: `postedAt DESC, id DESC` (tie-break on ID for cursor stability)
  - Cache: 45s per-user with cursor (line 24-25, feedController.ts)
  - Block filtering: Hidden user IDs excluded from feedUserIds (line 42)

- **Discover feed** (optional auth): Public posts only, excluding followed + own + blocked users
  - Filters: `privacy='public'` and `userId NOT IN (self, following, blocked)`
  - Cache: 300s (5min) for anonymous first page only
  - Ordering: Same tie-break pattern

**Privacy enforcement checkpoints:**
```
feedController.ts line 48-52 (OR conditions):
  - public (any user)
  - followers + user in accepted follows + user is author
  - user's own posts
```

**Issues:**
- Cache invalidation: queryKey `['feed']` vs mutation invalidation keys may not align fully
- No personalization/algorithm beyond chronological (intentional simple design)
- Discover feed excludes followed users (prevents re-seeing—good UX but not customizable)

---

### 1.3 Comments & Replies
**Status:** Fully wired, structured replies, soft-delete with count management

**Features:**
- Create comment: Privacy gates prevent non-followers from posting on followers-only posts
- Thread replies: Nested replies to comments (parentId → Comment.replies relation)
- Edit: Only author can edit (line 307, commentController.ts)
- Delete: Author OR post owner can delete (line 349); cascade deletes replies (line 377-380)
- Comment count: Denormalized on posts, decremented atomically in SQL (line 381, commentController.ts) to handle concurrent deletes safely
- Per-post toggle: `allowComments` boolean prevents all comments (line 31-36, commentController.ts)

**Privacy gates (consistent across create/getComments/getReplies):**
- Private posts: Only owner + actor can see/comment
- Followers posts: Only accepted followers + owner
- Public posts: Anyone

**Block-aware:** Blocked users filtered from comment lists (getHiddenUserIds + userId.notIn filter, line 180)

**Routes:**
```
POST   /api/v1/posts/:postId/comments        (createComment)
GET    /api/v1/posts/:postId/comments        (getComments, optionalAuth)
GET    /api/v1/comments/:commentId/replies   (getReplies, optionalAuth)
PATCH  /api/v1/comments/:commentId           (updateComment, authenticate)
DELETE /api/v1/comments/:commentId           (deleteComment, authenticate)
```

---

### 1.4 Saves & Collections
**Status:** Fully wired, simple save-to-post model

**Features:**
- Toggle save on post: Atomic increment/decrement of saveCount (line 35-40, 67-72, saveController.ts)
- Concurrent save handling: P2002 (duplicate) and P2025 (already removed) caught with idempotent responses
- getSavedPosts: Retrieves user's saved posts with `isSaved: true` flag (line 150)

**Privacy:** No explicit privacy enforcement on saves themselves—users can save any post they can view. Saved posts inherit visibility from original post's privacy.

**Routes:**
```
POST   /api/v1/posts/:postId/save            (toggleSave)
GET    /api/v1/posts/:postId/save/status     (checkSaveStatus, authenticate)
GET    /api/v1/posts/saved                   (getSavedPosts, authenticate)
```

---

### 1.5 Activities & Notifications
**Status:** Fully wired, in-app activity stream (no real-time; no email)

**Activity types:**
- `follow`, `follow_request`, `follow_accepted` (for private account flows)
- `comment`, `reply` (on posts/comments)
- `save` (on posts)
- Custom: triggered by utils/activity.ts createActivity() helper

**Features:**
- Activity stream: `/api/v1/activities` returns paginated unread activities (orderBy createdAt DESC)
- Unread count: `/api/v1/activities/unread` aggregates count of unread non-follow_request activities
- Mark read: Single activity or all activities via PATCH/PUT
- Soft-deleted posts: Tombstoned in activity responses (line 49-51, activityController.ts)
- Actor visibility: Shows follower username/avatar even if they're private

**Gaps:**
- **No real-time:** Polling-based only; no SSE/WebSocket
- **No email digests:** In-app only (Resend client available for setup but not integrated)
- **No notification preferences:** All activity types forced on
- **No mutes:** No way to suppress notifications from specific users
- **No activity deletion:** Activities remain even if post/comment is deleted (just post is tombstoned)

**Routes:**
```
GET    /api/v1/activities                     (getActivities, authenticate)
PATCH  /api/v1/activities/:id                 (markAsRead, authenticate)
PUT    /api/v1/activities/read-all            (markAllAsRead, authenticate)
GET    /api/v1/activities/unread              (getUnreadCount, authenticate)
```

---

### 1.6 Blocks & Mutes
**Status:** Blocks fully implemented; mutes not implemented

**Blocks:**
- Bidirectional visibility: Blocked users return 404 for profiles, posts, comments (not info-leaking)
- Auto-cleanup: Blocking user removes any existing follow relationships in both directions (line 46-56, blockController.ts)
- Cache: Block checks use cached getHiddenUserIds() with Redis key per-user (lib/blocks.ts)
- List blocked users: /api/v1/users/me/blocks paginated

**Mutes:** Not implemented. Missing:
- No `Mute` model
- No mute routes
- No notification filtering for muted users
- No way to hide posts from specific users without unfollowing

---

### 1.7 Reports & Moderation
**Status:** Report creation fully wired; no admin dashboard or enforcement

**Features:**
- Create report: POST /api/v1/reports (targetType: 'post' | 'comment' | 'journal' | 'user')
- Duplicate prevention: Unique constraint on (reporterId, targetType, targetId) + pre-check + P2002 catch (line 63-103, reportController.ts)
- Target validation: Confirms reported entity exists and isn't soft-deleted (line 11-47, reportController.ts)
- Anon reports supported (reporterId nullable)

**Gaps:**
- No admin API to retrieve/process reports
- No status tracking workflow (status='pending' but never updated)
- No reporter identity protection
- No follow-up to reporter
- No auto-action (delete, suspend)

---

### 1.8 Kindred & Recommendations
**Status:** Partially implemented (kindred travelers only)

**What exists:**
- `/api/v1/community/kindred` endpoint (in placeStoriesController.ts)
- Query: Finds users with highest geographic overlap (same cities visited)
- Result: Ranked by shared place count

**Gaps:**
- No general "suggested users" feed
- No follow suggestions on onboarding
- No "people you may know" based on mutual followers
- No algorithm tuning (hardcoded geo-overlap)
- Frontend integration unknown (search reveals placeStoriesController exists but kindred endpoint not verified in frontend)

---

## 2. PRIVACY MODEL - CURRENT STATE

### 2.1 Post Visibility Levels
**Status:** Three-level model fully enforced

**Levels:**
1. **public** — Anyone can view (default `Post.privacy='public'`)
2. **followers** — Only accepted followers + author
3. **private** — Only author

**Enforcement checkpoints:**
- **getPosts** (line 31-35, postController.ts): OR logic for public | (followers + accepted_follow) | own
- **getPostById** (line 113-140, postController.ts): Privacy gate + block check
- **getComments** (line 143-171, commentController.ts): Same privacy logic
- **getReplies** (line 235-263, commentController.ts): Loads parent, then checks post privacy
- **createComment** (line 53-73, commentController.ts): Prevents commenting on private/followers posts if not authorized
- **Feed queries** (line 48-52, feedController.ts): Applies same OR logic

**Enforcement is consistent** across controllers; uses 404 (not 403) to avoid leaking existence.

---

### 2.2 Profile Privacy & Account Settings
**Status:** Partial control, no comprehensive private account UI

**User model fields (schema.prisma line 12-62):**
- `isPrivate: Boolean @default(false)` — Triggers pending follows
- `showLocation: Boolean @default(true)` — User-level location visibility toggle
- `homeLat`, `homeLng`, `homeCity`, `homeCountry` — Profile location data
- `emailVerified` — Account verification status
- `isActive` — Soft deactivation flag (blocks login + refresh token generation; see authController.ts line 126, 246)

**What works:**
- `/PATCH /api/v1/users/me` updates isPrivate, showLocation, bio, avatar, etc. (line 136-177, userController.ts)
- Login: Rejects inactive accounts (line 126-132, authController.ts)
- Token refresh: Rejects inactive accounts (line 246-254, authController.ts)

**Gaps:**
- **No discoverable-toggle:** Private accounts still appear in search results (searchUsers doesn't filter by isPrivate; line 96-123, userController.ts)
- **No profile controls:** No way to hide followers/following lists separately
- **No login/comment controls:** Can't restrict who can comment without using private posts
- **Email never hidden:** Email shown in user export; no way to hide it from profile viewers
- **Home location exposure:** homeLat/homeLng exposed when showLocation=true but no fuzzing (exact coords visible)

---

### 2.3 Location Privacy
**Status:** Basic controls only; no fuzzing, no dynamic precision

**Post model fields (schema.prisma line 64-106):**
- `locationLat`, `locationLng` — Exact decimal coordinates (stored as Decimal type)
- `locationName`, `locationCity`, `locationCountry` — Human-readable location
- `showLocation: Boolean @default(true)` — Post-level location visibility toggle

**What's missing:**
- **No precision fuzzing:** Exact lat/lng exposed in API responses for public posts
- **No coordinate rounding:** No way to round to nearest block/city for privacy
- **No location obfuscation:** City-level only; can't hide exact coordinates
- **Search/explore:** Trending locations aggregated by city/country (exploreController.ts), but individual posts' exact coords exposed in feeds
- **Journey/album locations:** Same issue—no privacy controls on bundle locations

**Recommendation:** Real social apps (Instagram, TikTok) offer:
- Radius-only sharing (show location name but not exact coords)
- Neighborhood-level precision option
- Fuzzing with ±X km randomization

---

### 2.4 Album & Journal Privacy
**Status:** Follows post model (public/followers/private), but block filtering gaps exist

**Models:**
- `Album` & `Journal` both have `privacy` field (default 'public')
- Visibility enforced in getAlbum/getJournal endpoints (similar privacy gates to posts)

**But from prior audits (Issue #1402):**
- Block visibility NOT enforced on follower/following lists (getFollowers, getFollowing return blocked users)
- Albums/journals might not respect block visibility when listing by author

**Status:** Needs re-verification against current albumController/journalController.

---

### 2.5 Data Access & Export
**Status:** Full data export implemented, account deletion with cascade + count cleanup

**Export (`POST /api/v1/users/me/export`):**
- Downloads JSON with all user's data: posts, journals, albums, saves, follows, place notes, want-to-go, time capsules, scrapbooks
- **Includes email address** (line 14, dataExportController.ts)
- Rate-limited: 3/hour via Redis-backed limiter (line 16-28, users.ts route)
- Soft-deleted posts excluded (line 18, dataExportController.ts)

**Account deletion (`DELETE /api/v1/users/me`):**
- Hard delete: User record completely removed (cascading deletes all relations)
- Confirmation: Requires exact username match (line 100, dataExportController.ts)
- **Security gap (prior audit #1413):** No input validation on confirmUsername—accepts any string including empty
- Post count cleanup: Decrements saveCount + commentCount on affected posts atomically (line 112-155, dataExportController.ts) to prevent drift
- Soft-deleted comments still counted (line 121)
- Activity/report records still reference deleted user (userId foreign key SetNull on Report, but Activity still holds actorId)

---

### 2.6 Email & PII Exposure
**Status:** Email in export, in API responses, verification flow present

**Email handling:**
- Shown in self profile endpoint (`GET /api/v1/users/me`, authController.ts line 163-184)
- Included in data export (line 14, dataExportController.ts)
- Verification flow: Optional (can be skipped); not enforced
- Login: Accepts unverified accounts (no emailVerified check in login logic)

**PII leaks:**
- User search returns displayName, bio, homeCity, homeCountry (exposed to anyone, including unauthenticated users)
- Exact post location coords exposed in public posts
- Activity shows actor's public profile (username, displayName, avatar)

---

## 3. PRIVACY ENFORCEMENT - ENFORCEMENT POINTS AUDIT

### Controllers that filter by privacy/blocks:

| Controller | Method | Privacy Check? | Block Check? | Completeness |
|---|---|---|---|---|
| feedController | getPersonalizedFeed | ✅ (OR logic) | ✅ (hidden IDs) | Complete |
| feedController | getDiscoverFeed | ✅ (public only) | ✅ (excluded users) | Complete |
| postController | getPosts | ✅ (OR logic) | ✅ (if filtered by userId) | Partial (filterUserId path weak) |
| postController | getPostById | ✅ (privacy gate) | ✅ (block check) | Complete |
| postController | searchPosts | ✅ (public only) | ✅ (hidden IDs) | Complete |
| commentController | createComment | ✅ (privacy gate) | ✅ (block check) | Complete |
| commentController | getComments | ✅ (privacy gate) | ✅ (hidden IDs) | Complete |
| commentController | getReplies | ✅ (privacy gate) | ✅ (hidden IDs) | Complete |
| albumController | getAlbum | ✅ (privacy gate) | ⚠️ (uncertain) | Partial |
| albumController | getAlbums (by user) | ✅ (privacy OR) | ⚠️ (uncertain) | Partial |
| journalController | getJournal | ✅ (privacy gate) | ⚠️ (uncertain) | Partial |
| userController | getUserByUsername | ❌ (profile always visible) | ✅ (block check) | Partial |
| userController | searchUsers | ❌ (no isPrivate filter) | ✅ (hidden IDs) | Weak |
| followController | getFollowers | ❌ (block filtering present) | ✅ (hidden IDs) | Partial |
| followController | getFollowing | ❌ (block filtering present) | ✅ (hidden IDs) | Partial |
| exploreController | getFeaturedContent | ✅ (public only) | ✅ (filtered after cache) | Complete |
| exploreController | getTrendingLocations | ✅ (public only) | ❌ (no per-user filtering) | Weak |
| exploreController | getTrendingTags | ✅ (public only) | ❌ (no per-user filtering) | Weak |
| saveController | toggleSave | ❌ (relies on post visibility) | ❌ (no pre-check) | Weak |
| saveController | getSavedPosts | ❌ (no visibility re-check) | ❌ | Weak |

**Key gaps:**
1. **Post.searchPosts:** Public-only, but doesn't respect blocks on user profile pages (if used for profile filtering)
2. **User.searchUsers:** Returns private accounts; doesn't filter by isPrivate
3. **Save/getSavedPosts:** Doesn't re-verify post visibility after save created (posts could be deleted/privacy changed)
4. **Trending endpoints:** No per-user block filtering (shared cache)
5. **Follower/following lists:** Block-aware but listed regardless; no removal from view

---

## 4. AUTHENTICATION & SESSION MANAGEMENT

### Token Model
**Status:** JWT-based with refresh tokens, cookie-backed

**Flow:**
- Access token: Short-lived JWT (generated on each login/refresh), stored in `viraha_access` cookie (line 92, authController.ts)
- Refresh token: Long-lived opaque token, 7 days, stored in `viraha_refresh` cookie (line 73, authController.ts)
- Refresh: Token lookup + verify JWT + check expiry + confirm user.isActive (line 186-279, authController.ts)
- Logout: Deletes refresh token from DB + clears cookies (line 281-302, authController.ts)

**Models:**
```
RefreshToken {
  id, userId, token (unique), expiresAt, createdAt
}
PasswordReset {
  id, userId, token (unique), expiresAt, usedAt, createdAt
}
EmailVerification {
  id, userId, token (unique), expiresAt, usedAt, createdAt
}
```

### Session Management
**Status:** Basic; no session listing, logout-all non-functional (?), no device tracking

**Missing:**
- No "active sessions" list for user to view/revoke other devices
- No device fingerprinting or IP tracking
- Change password: Revokes ALL refresh tokens (line 336-338, authController.ts) — this is a logout-all, but no UI or explicit endpoint
- No session expiry UI or warning
- No "remember me" option (always 7-day tokens)

---

## 5. GAPS & MISSING FEATURES RANKED BY USER IMPACT

### HIGH IMPACT (User-facing, breaks social experience):

1. **No mute functionality** — Users can't hide posts from specific people without unfollowing. Core social feature missing.

2. **Follow requests UI missing** — Private accounts can receive follow requests, but no frontend for accepting/rejecting them. Entire feature unusable.

3. **Real-time notifications absent** — Activity stream is polling-only; no SSE/WebSocket. Delays mean users miss replies/follows immediately.

4. **Location precision exposure** — Exact GPS coordinates exposed in public posts with no fuzzing. Privacy/safety issue for travelers posting location-tagged photos.

5. **Email exposure in data export** — Email address included in downloadable data export; no way to hide it from export or profile.

6. **Discovery privacy broken** — Private accounts still appear in user search (searchUsers doesn't filter by isPrivate). Defeats account privacy setting.

7. **Per-post audience missing** — Only post-level privacy (public/followers/private); no per-post "share with specific people" or "hide from specific people" option.

### MEDIUM IMPACT (Affects safety/control):

8. **Comment controls limited** — Only allowComments on/off; no per-user blocking of mentions or replies from specific accounts.

9. **Location obfuscation not offered** — Can hide post location entirely (showLocation=false) but no middle ground (show location name, hide exact coords).

10. **No follow request notifications** — Follow requests create Activity but no in-app alert or email. User might not know they have pending requests.

11. **Session management absent** — Can't view active sessions or revoke specific devices. Password change revokes all (good security), but no finer control.

12. **Report follow-up missing** — Reports created but no way to track status or see action taken. Moderation invisible.

13. **Block visibility incomplete** — Blocks on follower/following lists not fully tested; trending content not filtered per-user; uncertain on albums/journals.

### LOW IMPACT (Nice-to-have; affects engagement):

14. **No mutual follow indicator** — Profiles don't show if you're mutually following someone.

15. **Email notification preferences** — No opt-in/opt-out for notification types (activity emails could be sent but aren't configurable).

16. **Algorithm very basic** — Feed is chronological only; no ranking by engagement, personalization, or re-ranking.

17. **No kindred/suggestions frontend** — Kindred travelers endpoint exists but not wired to UI; no suggested users feed.

---

## 6. WHAT'S SOLID & WORKING WELL

- **Post privacy enforcement:** Consistent 404-on-unauthorized pattern prevents information leaks
- **Block bidirectionality:** Blocks tear down follows; blocks hide both directions
- **Comment structure:** Proper nested replies with concurrent-safe count management
- **Data export:** Complete snapshot of user's data for GDPR
- **Account deletion:** Hard delete with proper cascade + count cleanup
- **Rate limiting:** Export endpoint protected; Redis-backed for multi-instance safety
- **Follow request flow:** Private accounts correctly auto-create pending follows
- **Activity creation:** Good coverage of interaction types (follow, comment, reply, save)
- **Cache invalidation:** Query keys structured to auto-invalidate on mutations
- **Soft delete consistency:** Deleted posts/comments consistently tombstoned in responses

---

## 7. ARCHITECTURE & DEPENDENCIES

**Backend:**
- Prisma ORM with PostGIS (location queries)
- Redis (optional): Caching + rate limiting (graceful degradation if not available)
- Resend email (optional): Verification/reset emails (fire-and-forget; not wired for activity notifications)
- Google OAuth (optional): Sign-in alternative
- Express 5 middleware: Auth (JWT), CSRF, rate limit, error handling

**Frontend:**
- Next.js 14 App Router
- TanStack React Query: Caching + infinite pagination for feeds/followers/activities
- Custom hooks: usePersonalizedFeed, useDiscoverFeed, useFollowStatus, useFollowUser, etc.
- No real-time library (would need Replicache, Socket.io, or similar for SSE)

---

## 8. RECOMMENDATIONS FOR OVERHAUL

**Phase 1 (Critical UX):**
- Add follower-list UI for private accounts + follow request management
- Implement mute model + filtering in activity/feed endpoints
- Add location fuzzing option (city-level, neighborhood-level, or radius)

**Phase 2 (Privacy Controls):**
- Add discoverability toggle (separate from isPrivate; controls search/trending visibility)
- Add per-post audience control (share with followers, specific list, or hide from specific users)
- Filter private accounts from searchUsers results
- Re-verify block visibility on albums, journals, follower/following lists

**Phase 3 (Notifications & Session):**
- Implement SSE or polling-lite for real-time activity
- Add activity email digest (configurable preferences)
- Add session listing + per-device logout
- Add email visibility control (export-only toggle)

**Phase 4 (Moderation & Safety):**
- Admin report dashboard + status tracking
- Auto-actions for reported content (suspension policies)
- Mention controls (restrict who can tag you)
- Soft report blocking (users can restrict replies from certain accounts without blocking)

---

## Appendix: Routes Map

### Core Social Routes (Express.ts route definitions)

**Users (users.ts):**
```
GET    /                                   - search users (optionalAuth)
GET    /:username                          - get profile (optionalAuth)
PATCH  /me                                 - update profile (authenticate)
POST   /me/export                          - export data (authenticate, rate-limited)
DELETE /me                                 - delete account (authenticate)
GET    /me/follow-requests                 - pending requests (authenticate)
GET    /me/blocks                          - blocked users list (authenticate)
POST   /:userId/follow                     - follow (authenticate)
DELETE /:userId/follow                     - unfollow (authenticate)
GET    /:userId/followers                  - followers list (optionalAuth)
GET    /:userId/following                  - following list (optionalAuth)
GET    /:userId/follow/status              - follow status (authenticate)
POST   /follow-requests/:followId/accept   - accept request (authenticate)
POST   /follow-requests/:followId/reject   - reject request (authenticate)
```

**Posts (posts.ts):**
```
GET    /                                   - list posts (optionalAuth)
GET    /:id                                - get post (optionalAuth)
POST   /                                   - create post (authenticate)
PATCH  /:id                                - update post (authenticate)
DELETE /:id                                - delete post (authenticate)
GET    /search                             - search posts (optionalAuth)
```

**Comments (comments.ts):**
```
POST   /:postId/comments                   - create comment (authenticate)
GET    /:postId/comments                   - get comments (optionalAuth)
GET    /:commentId/replies                 - get replies (optionalAuth)
PATCH  /:commentId                         - update comment (authenticate)
DELETE /:commentId                         - delete comment (authenticate)
```

**Saves (saves.ts):**
```
POST   /:postId/save                       - toggle save (authenticate)
GET    /:postId/save/status                - check save (authenticate)
GET    /                                   - get saved posts (authenticate)
```

**Activities (activities.ts):**
```
GET    /                                   - get activities (authenticate)
PATCH  /:id                                - mark read (authenticate)
PUT    /read-all                           - mark all read (authenticate)
GET    /unread                             - unread count (authenticate)
```

**Reports (reports.ts):**
```
POST   /                                   - create report (authenticate, anon ok)
```

**Community/Kindred (community.ts):**
```
GET    /kindred                            - kindred travelers (authenticate)
```

**Explore (explore.ts):**
```
GET    /trending/locations                 - trending cities (optionalAuth)
GET    /trending/tags                      - trending tags (optionalAuth)
GET    /featured                           - featured posts (optionalAuth)
```

**Feed (feed.ts):**
```
GET    /personal                           - personal feed (authenticate)
GET    /discover                           - discover feed (optionalAuth)
```

---

**Report compiled by:** Discovery Task  
**Last verified:** June 9, 2026  
**Next review:** After Phase 1 implementation
