# Wave 1 — Click-Path Audit

Branch: `mvp/stabilize-auth-post-feed-profile`
Date: 2026-05-12
Mode: read-only. Findings only.

Conventions:
- ✅ Working step verified by code reading.
- ❌ BROKEN = a hard break (missing handler, broken route, mismatched API contract).
- ⚠️ WEAK = works but UX gap (no loading state, silent error swallow, no a11y, etc.)

---

## Path 1: Sign up → first post

Click trail traced:
landing (`/`) → `/sign-up` → `POST /api/v1/auth/register` → `setUser(...)` → `router.push('/')` → `RootPage` redirects to `/home` → home FAB Link `/create/post` → `CreatePostForm` → `uploadPhotos` (`POST /api/v1/media/upload`) → `createPost.mutateAsync` (`POST /api/v1/posts`) → `router.push('/')` → home.

### ✅ Working steps
- Landing page redirects authenticated users to `/home` (`frontend/src/app/page.tsx:14-18`).
- Sign-up form: Zod validation, password strength meter, CSRF prefetch via `useEffect(fetchCsrfToken)` (`(auth)/sign-up/page.tsx:82-84`).
- `POST /auth/register` exists and is wired with `validateBody(registerSchema)` (`backend/src/routes/auth.ts:15`).
- Toast on success/error; loading prop on button. Reasonable error narrowing.
- FAB link `/create/post` is a Next `<Link>` (`(app)/home/page.tsx:54`).
- `CreatePostForm`: form validation + photo upload mutation + create-post mutation with proper `isPending` states (`components/post/create-post-form.tsx:489-497`).
- Backend endpoints `POST /media/upload` and `POST /posts` exist and require auth (`backend/src/routes/media.ts:8`, `backend/src/routes/posts.ts:13`).
- CSRF token sent on mutations via axios interceptor (`lib/api/client.ts:22-27`).
- Submit guards: `if (files.length === 0)` shows toast (`create-post-form.tsx:77-80`).

### ❌ BROKEN
- **B1. Sign-up does not redirect into the app.** `(auth)/sign-up/page.tsx:105` does `router.push('/')`. `/` is the marketing landing root that *re-redirects* to `/home` only after store hydration completes. There's a tiny chance the redirect fires before `useAuthHydrated()` flips and the new user briefly lands on the marketing splash. Sign-in correctly pushes to `/home` (`(auth)/sign-in/page.tsx:72`) — sign-up should match for consistency.
- **B2. Profile is NOT refreshed in `/profile/[username]` after first post.** `useCreatePost` invalidates `['posts']` only (`lib/hooks/use-posts.ts:28-30`). Profile fetches with `queryKey: ['posts', 'user', user.id]` (`profile/[username]/page.tsx:71-74`). Because that nested key starts with `'posts'`, the global `invalidateQueries({ queryKey: ['posts'] })` *will* match it by default (prefix match) — so this is actually OK at runtime but is fragile because there is no targeted invalidation. Mark as ⚠️ rather than ❌.
- **B3. Create-post form leaves `locationLat=0, locationLng=0` defaults that pass Zod** (`create-post-form.tsx:69-73`). User can submit a post with coordinates (0, 0) in the Gulf of Guinea without seeing the advanced-coordinates panel. There is no required-marker on the form for "you must pick a location." Functionally broken UX even though API accepts it.

### ⚠️ WEAK
- **W1. CSRF on register works only because `useEffect` fetches the token before the user can click**, but the GET `/auth/csrf-token` returns the token via cookie+body and `register` is a POST — if the token isn't fetched fast enough, the POST may fail. There's no retry/wait on submit (`(auth)/sign-up/page.tsx:99-113`). Sign-in mitigates with `await fetchCsrfToken()` before login (`sign-in:68`); sign-up does not.
- **W2. Social buttons "Continue with Google/Apple" are visually full-color but `disabled` (`sign-up:159, 193`)** — they look clickable, then do nothing. UX trap.
- **W3. Password strength bar shows but is informational only.** No enforced complexity beyond `min(8)`. Acceptable for MVP but flag.
- **W4. No `displayName` honored** — Zod schema accepts it, backend register schema… (need to confirm). Not verified.
- **W5. `CreatePostForm` shows generic toast on backend failure** with raw message; e.g., schema rejection messages will be exposed in toasts. Minor.
- **W6. After creating a post, user is sent to `/` (marketing root)** — same problem as B1. Confusing for a brand-new user. Should go to `/home` or directly to the new post detail.
- **W7. Privacy dropdown defaults to "public" but UI doesn't surface `followers` value** — backend `createPostSchema` accepts `private|followers|public` (`backend/src/validators/postValidators.ts:14`); UI only renders Public/Private (`create-post-form.tsx:448-459`).
- **W8. Photo upload has no per-file progress, no max-size guard before upload.** Big files just hang.

---

## Path 2: Sign in → feed → comment → save → /saved

Click trail traced:
`/sign-in` → `POST /auth/login` → `router.push('/home')` → sidebar `/explore` link → search/feed → `PostCard` Link → `/post/[id]` → `PostDetail` → comment input → `POST /posts/:id/comments` → bookmark icon → `POST /posts/:id/save` → sidebar `Saved` link… **but `/saved` is not in the sidebar nav** (see B4).

### ✅ Working steps
- `/sign-in` form: Zod validation, CSRF prefetched and re-fetched on submit, success → `/home`.
- `POST /auth/login` exists (`auth.ts:16`).
- `/home` has `AuthGuard` via `(app)/layout.tsx:7,14` — unauthenticated users redirected to `/sign-in`.
- `PostCard` wraps caption + image in `Link href={/post/${id}}` (`post-card.tsx:210,226`).
- Post detail page renders `PostDetail` with loading skeleton (`(app)/post/[id]/page.tsx:94-95`).
- Comment box: zod-light validation (trim/empty check), `useCreateComment(postId)` invalidates `['comments', postId]` and `['posts', postId]` (`use-comments.ts:31-34`).
- `POST /posts/:postId/comments` exists with `authenticate` + validator (`backend/src/routes/comments.ts:10`).
- Save toggle is optimistic with rollback on error (`post-detail.tsx:74-81`).
- `POST /posts/:postId/save` exists (`backend/src/routes/saves.ts:7`).
- `/saved/page.tsx` has empty state and skeleton (`saved/page.tsx:43-91`).

### ❌ BROKEN
- **B4. There is no link to `/saved` in the sidebar nav.** `sidebar.tsx:23-31` lists Home / Explore / Map / Albums / Journals / Journeys / Atlas only. Saved is reachable only via profile tab "Saved" or by typing the URL. The Saved page exists and works; users can't discover it.
- **B5. `/feed` route is a dead redirect to `/explore`** (`(app)/feed/page.tsx:6-13`). Cosmetic, but `/feed` is the URL referenced in the user prompt and several historical commits — confirm intentional.
- **B6. Comment input button on `PostDetail` shows `Send` icon but the `IconButton` is inside the form and submits — but `type="submit"` ✅. However, the form-submit handler calls `e.preventDefault()` and then `createComment.mutate({ text })`** — `handleCommentSubmit` is missing error UI; the only feedback on failure is silently failing to clear the input (the input clears only `onSuccess`, `post-detail.tsx:99-103`). No toast on error → user retries blindly.
- **B7. `/post/[id]` back button (`ArrowLeft`) hardcodes `href="/"`** (`post-detail.tsx:163-164`). That sends the user to the marketing root instead of where they came from (feed/profile). Browser back works, but the in-UI back button does not respect history.
- **B8. `commentCount` and `saveCount` on `PostDetail` are stale after add comment / save.** The hook invalidates `['posts', postId]` but the parent `PostPage` uses `usePost(id)`, so it does refetch — OK. But the displayed save count on the bookmark icon (`post-detail.tsx:519-523`) reads from `post.saveCount` not from a local optimistic state, so after toggling save, the count remains stale until refetch lands. Minor data race.

### ⚠️ WEAK
- **W9. `PostDetail` "Share" button has no onClick** (`post-detail.tsx:363-377`). Looks live, does nothing.
- **W10. `MoreHorizontal` button on `PostCard` calls `e.preventDefault()` only** (`post-card.tsx:202`) — no menu, no feedback. Dead button.
- **W11. No error UI on `/saved` page if the saves list fetch fails.** `isLoading` and `posts.length === 0` are both handled; an actual error from the API renders nothing (`saved/page.tsx:43-65`).
- **W12. Save list in `/saved` only loads first page — "Load More" exists, but failure of `fetchNextPage` is silent** (no toast / inline error).
- **W13. `usePost` will use mock data fallback when the API errors** (`(app)/post/[id]/page.tsx:99`). A 401 or 500 will silently render mock content. Bug-friendly during demo, dangerous in production.
- **W14. The "Add to Album" `FolderPlus` button** opens dialog only if authenticated. The dialog component is loaded but no separate audit done here.

---

## Path 3: Profile → follow → see in feed

Click trail traced:
`/profile/[username]` → `UserProfileHeader` Follow button → `POST /users/:id/follow` → return to `/explore` → "Following" tab → `GET /feed` → should show their public posts.

### ✅ Working steps
- `useUserProfile` fetches `GET /users/:username` (`use-user.ts` → `users.ts:18-21`); matches backend `users.ts:21`.
- Follow button shows optimistic state with rollback (`user-profile-header.tsx:44-58`).
- `useFollowUser`/`useUnfollowUser` mutations exist; invalidate `['follows', userId]` and `['users']` (`use-follows.ts:14-34`).
- Backend `POST /users/:userId/follow` and `DELETE /users/:userId/follow` exist (`backend/src/routes/users.ts:22-23`).
- Followers/Following dialogs wired to `GET /users/:userId/followers` and `…/following`.
- `/feed` (personalized) route exists with `authenticate` middleware (`backend/src/routes/feed.ts:7`).

### ❌ BROKEN
- **B9. Follow does NOT invalidate the personalized feed.** `useFollowUser.onSuccess` invalidates `['follows', userId]` and `['users']` but NOT `['feed']` (`use-follows.ts:18-22`). After following, the feed shown in `/explore` "Following" tab will not refetch until the user navigates or refreshes. The path "Follow → see in feed" silently appears broken to the user.
- **B10. Profile page does NOT invalidate `useUserProfile` after follow** — `isFollowing`, `followerCount` come from the initial profile fetch and are only adjusted optimistically in component state. If the user leaves the profile and comes back, counts may be stale until the next `users/:username` GET. This is acceptable but the optimistic adjust in `UserProfileHeader` uses local `useState(user.isFollowing)` initialized once; when the API result mounts with a different `isFollowing`, the state will not re-sync unless the component remounts.
- **B11. The "Message" button on `UserProfileHeader` (`user-profile-header.tsx:247-250`) has no onClick handler** — pure dead button.
- **B12. Follow status race**: `useFollowStatus(post.user.id)` in `PostDetail` and `UserProfileHeader.isFollowing` use *different* sources. The post-detail follow button uses `useFollowStatus` (network GET), the profile header uses `user.isFollowing` from the profile payload. After a follow on one screen, the other won't pick it up because the invalidation hits `['follows', userId]` (status query) but not `['user', username]` (profile query).

### ⚠️ WEAK
- **W15. No empty state for private profile** when user is not followed — the profile page only renders posts/albums/etc with no privacy gate (the gate is `Saved` tab only, `profile/[username]/page.tsx:336-356`).
- **W16. Avatar cover image** loads via `<img src={user.avatar}>` with no fallback handler — broken URLs will render the alt text.
- **W17. Following list dialog opens via stat click but the divider span and stat boxes don't have `role=button` / keyboard a11y** (`user-profile-header.tsx:181-219`).
- **W18. No skeleton for the follow button while `useFollowStatus` loads** in `PostDetail` — `isFollowing` defaults to `false`, so the button will flicker "Follow" → "Following" if the user is already following.

---

## Path 4: Map exploration

Click trail traced:
sidebar `/map` → `MapPage` → filter pills (All/Posts/Journals + Everyone/Mine) → marker pin → `PlaceHistoryDrawer` opens → "View post" link → `/post/:id` → back.

### ✅ Working steps
- Map page loads via `useMapMarkers(queryParams)` against `GET /map/markers` (`api/map.ts:9-22`, backend `map.ts:7`).
- Filter pills toggle local state, `queryParams` memoized correctly (`map/page.tsx:380-388`).
- Loading state with spinner (`map/page.tsx:438-453`).
- Marker click opens `PlaceHistoryDrawer` via callback (`map/page.tsx:365-372,471`).
- Popups embed `Link href={/post/${id}}` for "View post" (`map/page.tsx:251-257,322-335`).
- Want-to-Go pins are merged in (`map/page.tsx:487-530`).
- `Timeline scrubber` updates date range filters (`map/page.tsx:374-377`).

### ❌ BROKEN
- **B13. The `MarkerPopup` "View post" Link and marker click open BOTH a popup *and* the place-history drawer.** The marker has an `onClick` that opens drawer (`map/page.tsx:471`), and the popup `<Link>` navigates to `/post/:id`. Clicking the marker pin pops the popup AND opens the drawer; clicking "View post" navigates away. UX confusion.
- **B14. `MapPage` renders a `<Map>` component that depends on `mapboxStyleUrls`** which is undefined when `NEXT_PUBLIC_MAPBOX_TOKEN` is missing (`map/page.tsx:35-40`). The component receives `styles={undefined}`. If `Map` component does not have a fallback (which `(app)/explore/page.tsx` does — uses OpenFreeMap), the entire map page is broken when env var is unset. The recent commit message "switch map tiles to OpenFreeMap" implies the move; verify `components/ui/map` actually has the fallback. (Could not confirm without reading map component; flag for verification.)
- **B15. No empty state when filters return zero markers.** The badge shows "0 memories" but the map sits empty with no message ("No memories match these filters") (`map/page.tsx:557-590`).

### ⚠️ WEAK
- **W19. Filter changes do not preserve scroll/zoom of the map** — every filter change refetches; markers re-add but the underlying map view state should persist. Likely fine but un-tested.
- **W20. `Locate` and `Fullscreen` map controls are shown via `<MapControls showLocate showFullscreen>`** (`map/page.tsx:532-538`). If geolocation permission is denied, no UI feedback.
- **W21. `useMapMarkers` is called with global bounds (–90..90, –180..180), so the dataset is unbounded.** No pagination, no cluster — at scale this will be a perf hit.
- **W22. No error UI if `/map/markers` 5xxs** — page silently shows empty map.

---

## Path 5: Profile own → edit → settings → privacy toggle

Click trail traced:
sidebar avatar → `/profile/[username]` (own) → `UserProfileHeader` "Edit Profile" Link → `/settings` → tabs (Profile/Appearance/Privacy/Account) → Privacy → toggle `isPrivate` switch → `PATCH /users/me`.

### ✅ Working steps
- "Edit Profile" button on own profile is `<Button component={Link} href="/settings">` (`user-profile-header.tsx:224-228`).
- `/settings` page wrapped in `AuthGuard` (`settings/page.tsx:786-792`).
- Profile tab submits `PATCH /users/me` via `updateProfile()` (`settings/page.tsx:104-117`).
- Backend `PATCH /users/me` exists with `validateBody(updateProfileSchema)` (`backend/src/routes/users.ts:12`). Schema accepts `isPrivate` and `showLocation` (`backend/src/validators/userValidators.ts:11-12`).
- Privacy tab toggle uses optimistic update with rollback (`settings/page.tsx:470-483, 485-498`).
- Avatar upload calls `POST /media/avatar` and updates auth store (`settings/page.tsx:75-89`).
- Change-password tab has zod validation including confirm-match (`settings/page.tsx:36-43`).

### ❌ BROKEN
- **B16. `showLocation` is sent in `updateProfile({ showLocation: value } as ...)` but the frontend `UpdateProfileInput` type may not include it** (`settings/page.tsx:489`). The `as Parameters<…>[0]` cast is a smell that the contract is not aligned. Backend validator does accept it, so it will work, but TypeScript no longer guarantees correctness. Verify `UpdateProfileInput` in `frontend/src/lib/types/index.ts:104` does include `showLocation` — line 105 shows `showLocation?` ✅. So the cast is unnecessary; the type already accepts it. Cast can be removed.
- **B17. `PrivacyTab` reads `showLocation` from local state initialized to `true`** (`settings/page.tsx:467`) — there is no field on the User type for `showLocation` so the displayed switch state does **not reflect the actual server value** on first load. The toggle is always rendered as "on" until the user clicks it. After clicking, it persists but the next reload still defaults to "on". Functional persistence bug.
- **B18. `AccountTab` calls `changePassword({ currentPassword, newPassword })` (`settings/page.tsx:597-600`) → `POST /auth/change-password`** which exists ✅. However on success it does `reset()` but does not invalidate or sign-out. After password change, the existing JWT remains valid — could be intentional but should at least surface a "sign out other sessions?" prompt. Mark ⚠️.

### ⚠️ WEAK
- **W23. No confirmation prompt on Private Account toggle.** Flipping to private is a significant action; should confirm.
- **W24. `ProfileTab` form has no error display for `displayName`/`bio` length validation** — Zod errors are formed but the form never reads `formState.errors` (`settings/page.tsx:91-94`). Server returns 422 with message which goes to toast; client-side errors are invisible.
- **W25. Avatar file input accepts arbitrary jpeg/png/webp but no max-size client check.** Backend will fail with 413; user sees generic "Failed to upload avatar".
- **W26. Settings tabs are not deep-linkable** — `activeTab` is local state; refreshing on Privacy tab returns user to Profile tab.
- **W27. No "Delete Account" or "Export Data" UI** even though backend endpoints `DELETE /users/me` and `POST /users/me/export` exist (`backend/src/routes/users.ts:14-15`). Dead backend features.
- **W28. The "Edit Profile" button on the profile page says "Edit Profile" but routes to `/settings`** (which is fine) — no in-place edit modal; minor UX nit.

---

## Top 10 Fix Priorities

Ranked by user impact × severity. Highest first.

1. **B17 — Privacy `showLocation` toggle reads default `true` instead of user's real value** (`settings/page.tsx:467`). Users think they've hidden their location but the UI re-shows "on" every reload, so they can't trust the setting. Pull `showLocation` from `useAuthStore().user` and add the field to the User type if missing.
2. **B9 — Follow does not invalidate the personalized feed** (`use-follows.ts:18-22`). Add `queryClient.invalidateQueries({ queryKey: ['feed'] })` in `useFollowUser` and `useUnfollowUser`. This is the single most visible Path-3 failure: user follows, returns to feed, sees nothing change.
3. **B4 — No sidebar link to `/saved`** (`sidebar.tsx:23-31`). Add a Bookmark icon nav item between Journals and Atlas. Page exists and works; just unreachable.
4. **B3 — `CreatePostForm` defaults `locationLat=0, locationLng=0` and validates them as valid** (`create-post-form.tsx:69-73`). Either require a location pick (a map picker) or surface coords by default with a validator that rejects `(0,0)` unless explicit.
5. **B13 — Map marker pin: clicking opens both popup AND drawer** (`map/page.tsx:471`). Choose one interaction. Recommendation: marker click opens popup; the drawer should open from a "Place history" button inside the popup.
6. **B7 — `PostDetail` back button hardcoded to `/`** (`post-detail.tsx:163-164`). Use `router.back()` with fallback to `/explore`.
7. **B1/W6 — Sign-up and post-create both redirect to `/`** (marketing root) instead of `/home` or `/post/:id`. Tighten to `/home` after sign-up; route to the new post on create.
8. **W10/B11/W9 — Dead buttons across post and profile**: PostCard `MoreHorizontal` (`post-card.tsx:202`), PostDetail `Share2` (`post-detail.tsx:363-377`), UserProfileHeader "Message" (`user-profile-header.tsx:247-250`). Either implement (share = clipboard copy like PostCard already has) or remove until built.
9. **B6 — Comment submit failure shows no error** (`post-detail.tsx:92-105`). Add a toast in `createComment.mutate(..., { onError: (e) => toast.error(...) })`.
10. **B14 — Verify `Map` component fallback for missing `NEXT_PUBLIC_MAPBOX_TOKEN`.** Profile map and `/map` page both pass `styles={mapboxStyleUrls}` which is `undefined` when env is unset. Confirm `components/ui/map` falls back to OpenFreeMap globally, not only on `explore/page.tsx` (which builds its own map manually). If not, both routes are dark for installs without a Mapbox token.

