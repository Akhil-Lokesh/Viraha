# Wave 3 Review — Auth & Privacy Commits
Branch: mvp/stabilize-auth-post-feed-profile
Reviewer: Wave 3 Reviewer #1
Commits reviewed: 46ffed7, d6be1c8

---

## Commit 46ffed7 — fix(auth): stabilize refresh, logout, CSRF identifier, expired token cleanup

### C1 — Refresh validator removed
VERIFIED. `backend/src/routes/auth.ts:18` now reads `router.post('/refresh', refreshTokenHandler)` — no `validateBody`. The dead `refreshTokenSchema` and its type export are removed from `authValidators.ts`. Fix is complete and correct.

### C2 — Logout uses optionalAuth
VERIFIED. `backend/src/routes/auth.ts:19` applies `optionalAuth`. The handler at `authController.ts:222–243` correctly branches:

```typescript
where: req.user
  ? { token: refreshToken, userId: req.user.userId }
  : { token: refreshToken },
```

Mental test — user with NO cookies hits POST /logout:
- `optionalAuth` sees no access cookie → `req.user` stays `undefined`, calls `next()`.
- Handler: `refreshToken = req.cookies?.viraha_refresh` → `undefined`.
- `if (refreshToken)` is falsy → the Prisma delete is skipped entirely.
- `clearAuthCookies(res)` runs (clears already-empty cookies, harmless).
- Returns `200 { success: true, data: { message: 'Logged out successfully' } }`.

This is the correct behaviour. No regression.

**NEW BUG — MEDIUM:** The fallback `{ token: refreshToken }` branch (unauthenticated user who still has a refresh cookie but an expired/absent access token) deletes the refresh token by value alone without validating that the caller knows the user identity. This is safe for now because the refresh token is a random 256-bit value and is httpOnly — an attacker cannot read it from JavaScript. However, if any future code path causes the refresh token to leak (logs, error body), an attacker could force-logout any user. Flag for hardening when LOW-02 (plaintext token storage) is addressed.

### C3 — CSRF identifier now uses viraha_refresh
VERIFIED. `backend/src/middleware/csrf.ts:9` reads `req.cookies?.viraha_refresh || req.ip || 'anonymous'`. The `viraha_refresh` cookie has a 7-day TTL so it is stable across the 15-minute access token rotation — the original spurious-403 window is closed.

**RESIDUAL ISSUE — MEDIUM (partially addressed, not fully fixed):** For unauthenticated users (login form, register form, CSRF prefetch), `viraha_refresh` is absent. The fallback is `req.ip || 'anonymous'`. The `'anonymous'` string fallback — all requests landing without a detectable IP share one CSRF session identifier. Wave 1 security.md MED-01 flagged this as allowing CSRF token reuse across NAT'd users. The commit swaps the unstable identifier for a more stable one, but does not introduce a persistent unauthenticated session cookie. The NAT/anonymous-collapse problem remains. This was originally MED-01 in security.md and is not closed by this commit; it remains open.

### C4 — updateProfile body forwarding fixed
VERIFIED. `backend/src/controllers/userController.ts:118–153` now explicitly destructures all allowed fields from the body and builds a sanitized `data: UpdateProfileInput` object before passing to Prisma. The Prisma `select` on the update query also excludes `passwordHash` from the response. Fix is complete and correct.

### M3 — sanitizeUser typed as generic
VERIFIED. `authController.ts:10`:

```typescript
function sanitizeUser<T extends { passwordHash?: string }>(user: T): Omit<T, 'passwordHash'>
```

The generic constraint `T extends { passwordHash?: string }` is correct and non-restrictive. Every current caller passes a Prisma user object which always has `passwordHash: string` (non-optional). The `?` in the constraint makes it permissive to future callers that might not have the field at all — structurally sound.

**No callers are excluded.** All three call sites (`register`, `login`, `me` in `authController.ts`) pass a full Prisma `User` which satisfies the constraint. The rest value typed as `Omit<T, 'passwordHash'>` is returned correctly.

### M4 — Expired token cleanup
VERIFIED. `authController.ts:189`:

```typescript
await prisma.refreshToken.delete({ where: { id: storedToken.id } }).catch(() => {});
```

Token is deleted before returning the 401. The `.catch(() => {})` swallows deletion errors silently — acceptable here since the 401 is already correct regardless; a failed deletion is a leaking-token risk not a correctness risk.

**Note:** The `verifyRefreshToken` JWT check at lines 178–186 runs BEFORE the `expiresAt` DB check at line 188. A token that is JWT-valid but DB-expired (clock skew edge) would still reach the expiry check and be deleted. A token that is JWT-invalid returns 401 at line 181 without touching the DB record. This is fine for the JWT-invalid case (the DB record is harmless stale data) but means expired-JWT tokens are never cleaned up by this path — a minor hygiene gap, not a security issue.

---

**VERDICT — 46ffed7: NEEDS FIX (one medium finding)**

| Finding | Severity | File:Line |
|---------|----------|-----------|
| Unauthenticated logout deletes token by value alone — hardening gap if refresh token ever leaks | MEDIUM | `backend/src/controllers/authController.ts:228–231` |
| CSRF fallback to `req.ip \|\| 'anonymous'` for unauthenticated users — MED-01 from security.md remains open | MEDIUM (pre-existing, not introduced by this commit) | `backend/src/middleware/csrf.ts:9` |
| JWT-invalid refresh tokens not cleaned from DB | LOW | `backend/src/controllers/authController.ts:178–186` |

---

## Commit d6be1c8 — fix(privacy): gate comments by post privacy; filter album post privacy; reject cross-user album adds

### CRIT-01 — Comment privacy gate
VERIFIED. `commentController.ts:96–124` (getComments) and `commentController.ts:181–209` (getReplies) both implement the full privacy gate:
- Owner bypass: `post.userId !== req.user?.userId` (correct use of optional chaining)
- `private` posts: immediate 404 for any non-owner regardless of auth state
- `followers` posts: 404 for unauthenticated; `prisma.follow.findUnique` with `status: 'accepted'` check for authenticated non-owner

Mental test — `req.user` is `undefined` on a `followers`-only post:
- `post.userId !== req.user?.userId` → `post.userId !== undefined` → true (enters the gate)
- `post.privacy === 'followers'` branch reached
- `if (!req.user)` → true → returns 404

Correct. Unauthenticated requests to followers-only post comments return 404 without leaking existence. Fix is complete for both `getComments` and `getReplies`.

**NEW BUG — LOW:** `createComment` at `commentController.ts:13–78` is protected by `authenticate` (req.user always defined) and does check post existence. However it does NOT check post privacy — an authenticated user who is NOT a follower of a private-account post owner can still post comments on a `followers`-only post if they know the postId. This is a post-fix regression scope gap (createComment was not gated before either, but now the read side is gated while the write side is not). Not introduced by this commit, but the fix creates an inconsistency that makes it visible.

**File:** `backend/src/controllers/commentController.ts:13–27`

### HIGH-03 — Album post privacy leak
VERIFIED. `albumController.ts:482–515` (getAlbumPosts) implements per-post privacy filtering:
- For authenticated users: pre-fetches `followedIds` set in a single batched query (correct N+1 avoidance)
- Filter correctly handles: own posts (always visible), private posts (always hidden unless own), followers posts (hidden if unauthenticated, hidden if not in followedIds)

Mental test — `req.user` is `undefined` (unauthenticated visitor):
- `followedIds` stays as `new Set()` (the `if (req.user)` block is skipped)
- Filter: `if (req.user && post.userId === req.user.userId)` → false
- `if (post.privacy === 'private')` → `return false` (correct)
- `if (post.privacy === 'followers')`: `if (!req.user) return false` (correct)
- Public posts fall through to `return true` (correct)

Fix is complete and correct for unauthenticated visitors.

### HIGH-03 — Cross-user album post addition
VERIFIED. `albumController.ts:332–339`:

```typescript
if (post.userId !== album.userId) {
  res.status(403).json({ ... });
  return;
}
```

The comparison is `post.userId !== album.userId`, NOT `post.userId !== req.user.userId`. This is the correct comparison. The earlier check at line 314 already guarantees `album.userId === userId` (the authenticated user), so the two checks together enforce: caller owns the album AND post belongs to same user as album. Logically equivalent to `post.userId !== req.user.userId` but more defensive (works even if album ownership and user identity somehow diverge).

**MINOR NOTE — LOW:** `albumController.ts:349` still contains `const updateData: any = { ... }`. This is pre-existing (not introduced by this commit) but is a `any` violation per project rules. Should be `Prisma.AlbumUpdateInput`.

**File:** `backend/src/controllers/albumController.ts:349`

---

**VERDICT — d6be1c8: NEEDS FIX (one low finding introduced by scope gap)**

| Finding | Severity | File:Line |
|---------|----------|-----------|
| `createComment` does not check post privacy — authenticated non-followers can write comments on followers-only posts | LOW (scope gap, not introduced by commit) | `backend/src/controllers/commentController.ts:13–27` |
| `updateData: any` in `addPostToAlbum` — pre-existing, not introduced by commit | LOW (pre-existing) | `backend/src/controllers/albumController.ts:349` |

---

## TypeScript Compiler

`cd backend && npx tsc --noEmit` — clean, zero errors.

---

## If You Wanted to Be Extra Safe

1. **Add post privacy check to `createComment`** — mirror the same gate already in `getComments`. Without it, the read/write privacy contract is inconsistent.

2. **Introduce a stable unauthenticated CSRF cookie** — set a random `viraha_session_id` httpOnly cookie on first visit (in `GET /auth/csrf-token`), use it as the CSRF session identifier. Closes MED-01 entirely and eliminates the `'anonymous'` collapse.

3. **Clean up JWT-invalid refresh tokens** — in the `verifyRefreshToken` catch block, attempt `prisma.refreshToken.delete({ where: { token } }).catch(() => {})` to remove stale DB records for cryptographically invalid tokens.

4. **Replace `updateData: any` in `addPostToAlbum`** with `Prisma.AlbumUpdateInput` — one line change, eliminates the last `any` in `albumController.ts`.

5. **Audit `deleteComment` privacy** — `deleteComment` at `commentController.ts:267` is `authenticate`-only and does not check if the authenticated user is allowed to view the post. A non-follower can delete their own comment on a followers-only post (if they somehow previously commented). Low risk but inconsistent with the new read-side gates.

---

## Summary

| Commit | Verdict | Critical | High | Medium | Low |
|--------|---------|----------|------|--------|-----|
| 46ffed7 | NEEDS FIX | 0 | 0 | 2 | 1 |
| d6be1c8 | NEEDS FIX | 0 | 0 | 0 | 2 |

All original findings (C1, C2, C3, C4, M3, M4, CRIT-01, HIGH-03) are correctly addressed. No new critical or high issues introduced. Two medium issues remain open (CSRF unauthenticated fallback; logout token-by-value-only hardening gap). Four low issues identified, two pre-existing.
