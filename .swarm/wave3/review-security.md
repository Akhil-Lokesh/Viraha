# Wave 3 Security Review — Commit 4935893

Reviewer: Wave 3 Reviewer #3 (security)
Branch: mvp/stabilize-auth-post-feed-profile

---

## Findings Per Wave 1 Item

### HIGH-04 (DOMPurify style attribute) — FIX INCOMPLETE / NEW REGRESSION

**Status: PARTIALLY FIXED — alignment rendering is now silently broken.**

`'style'` was correctly removed from `ALLOWED_ATTR` in `/Users/akhil/Desktop/Viraha/frontend/src/lib/utils/sanitize-html.ts`. The XSS vector is closed.

However, the commit message claims `data-text-align` was "retained for the rich-text editor." This claim is incorrect. The Tiptap `@tiptap/extension-text-align` extension does **not** output `data-text-align` on elements — it outputs `style="text-align: left|center|right|justify"` directly:

```js
// node_modules/@tiptap/extension-text-align/dist/index.js
renderHTML: (attributes) => {
  return { style: `text-align: ${attributes.textAlign}` };
```

The `data-text-align` attribute in `ALLOWED_ATTR` is never written by Tiptap and serves no functional purpose. Existing journal entries that contain aligned paragraphs (with `style="text-align: center"`) will have that attribute stripped by DOMPurify on render. Text alignment will be silently lost for all stored journal content. This is a rendering regression, not a security issue, but it was introduced by this commit.

The `.journal-content` CSS block in `/Users/akhil/Desktop/Viraha/frontend/src/app/(app)/journals/[id]/page.tsx` does not contain any `[data-text-align]` CSS rules, confirming `data-text-align` was never wired to produce alignment CSS at render time.

**Correct fix:** Add CSS rules to the `.journal-content` block that map `[data-text-align]` values to `text-align`, and configure the Tiptap `TextAlign` extension to write `data-text-align` instead of `style`. Specifically, pass `renderHTML` override to the extension or use a custom extension. Do not restore `'style'` to `ALLOWED_ATTR`.

**SVG style= re-injection:** DOMPurify handles SVG `style=` the same way as on HTML elements — since `'style'` is not in `ALLOWED_ATTR`, it is stripped on SVG elements too. No bypass identified here.

---

### MED-05 (HSTS) — FIXED CORRECTLY

`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` added to the `headers()` block in `/Users/akhil/Desktop/Viraha/frontend/next.config.ts`. max-age is 63072000 (2 years, above the 1-year preload minimum). `includeSubDomains` and `preload` are present. Fix is correct.

**Minor note:** HSTS delivered by Next.js `headers()` is sent on all routes including HTTP responses in development. This is harmless (browsers ignore HSTS on non-HTTPS origins), but worth noting for local dev environments.

---

### MED-04 (email in localStorage) — FIX CORRECT; MIGRATION COVERS EXISTING SESSIONS

**Status: FIXED.**

The `partialize` function in `/Users/akhil/Desktop/Viraha/frontend/src/lib/stores/auth-store.ts` correctly restricts persisted shape to `{ id, username, displayName, avatar, isPrivate, showLocation }` via `stripToPersisted()`.

The v1 → v2 migration path (`if (version === 1)`) calls `stripToPersisted(old.user ?? null)`. When Zustand detects a stored version 1 payload, it runs the migration on hydration, which strips `email`, `bio`, `homeCity`, `homeCountry`, `homeLat`, `homeLng`, `emailVerified`, `isActive`, `lastLoginAt`, `createdAt`, `updatedAt` before writing the new state. **Existing v1 users will have PII stripped on their next page load.** The migration is correct.

**Null safety:** `state.user ? {...} : null` is not used — the `stripToPersisted` function handles `null` input explicitly with `if (!user) return null`. This is safe.

**Downstream impact:** No rendering path reads `user.email` from the auth store. The email grep shows all `.email` references in the frontend are in auth form components (sign-in, sign-up, forgot-password) where email comes from form state, not from the Zustand store. Settings and profile pages read only `user.id`, `user.username`, `user.displayName`, `user.avatar`, `user.isPrivate`, `user.showLocation` from the store — all of which are included in `PersistedUser`. No undefined field reads will surface.

**Remaining gap:** The `User` interface in `/Users/akhil/Desktop/Viraha/frontend/src/lib/types/index.ts` still declares `email: string` (non-optional), but the persisted `PersistedUser` type does not include it. Any code that accesses `user.email` on the in-memory `AuthState.user` (which is typed as `User | null`) will still work during a live session because `setUser` stores the full `User` object from the `/me` API response in memory. The type system correctly enforces this separation via `PersistedUser` vs `User`.

---

### HIGH-01 (CSRF_SECRET required in production) — FIX CORRECT

**Status: FIXED.**

In `/Users/akhil/Desktop/Viraha/backend/src/config/env.ts`, the `refine()` now checks:
```typescript
if (!data.CSRF_SECRET || isPlaceholder(data.CSRF_SECRET)) return false;
```

`CSRF_SECRET` remains `optional()` in the base schema (so the field type is `string | undefined`), but the production refine rejects `undefined` via `!data.CSRF_SECRET` and rejects placeholder values via `isPlaceholder()`. This means:

- `NODE_ENV=production`, no `CSRF_SECRET` set → `!data.CSRF_SECRET` is true → `process.exit(1)`. Correct.
- `NODE_ENV=production`, `CSRF_SECRET=CHANGE_ME` → `isPlaceholder` checks `.toLowerCase().includes('changeme')` — `CHANGE_ME`.toLowerCase() = `change_me`, which does NOT match `changeme` (underscore vs no separator). **This placeholder would NOT be caught.**
- `NODE_ENV=production`, `CSRF_SECRET=change-this-...` (the `.env.example` value) → matches `'change-this'` → caught. Correct.

**NEW MEDIUM FINDING — HIGH-01-PARTIAL:** The `PLACEHOLDER_SECRETS` list does not include `change_me` or `change-me` (only `changeme`). A naive operator who sets `CSRF_SECRET=CHANGE_ME_32charpadding__________` would bypass the placeholder check because `change_me` does not appear in the list. This is a narrow gap but real. Recommend adding `'change_me'`, `'change-me'`, and `'placeholder'` to `PLACEHOLDER_SECRETS`.

---

## New Regression Summary

| ID | Severity | Description | File |
|----|----------|-------------|------|
| REG-01 | MEDIUM | Tiptap TextAlign writes `style=` not `data-text-align`; removing `'style'` silently breaks text alignment rendering for all stored journal content | `frontend/src/lib/utils/sanitize-html.ts`, `frontend/src/components/journal/rich-text-editor.tsx` |
| REG-02 | LOW | `PLACEHOLDER_SECRETS` missing `change_me` / `change-me` variants; CSRF_SECRET set to `CHANGE_ME_...` bypasses production guard | `backend/src/config/env.ts` |

---

## Overall Verdict

HIGH-04 and MED-05 and MED-04 and HIGH-01 were addressed. The XSS vector from `style=` is closed. HSTS is correctly configured. Email PII is no longer persisted to localStorage with working migration for existing sessions. CSRF_SECRET is required in production.

However, the HIGH-04 fix introduced a rendering regression (REG-01 MEDIUM): Tiptap text alignment output is now stripped by DOMPurify because the fix incorrectly assumed Tiptap writes `data-text-align`, when it writes `style="text-align:..."`. The correct fix requires configuring Tiptap to emit `data-text-align` and adding corresponding CSS, rather than relying on `data-text-align` passthrough with the `style` attribute removed.
