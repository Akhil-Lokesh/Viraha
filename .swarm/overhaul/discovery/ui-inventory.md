# Viraha Frontend UI Inventory — Complete Discovery Report

**Date:** June 9, 2026  
**Project:** Viraha (Travel memory platform — "Letterboxd for travel")  
**Scope:** Full frontend UI/UX redesign discovery  
**Status:** PRESERVED — Navigation/menubar only; all other UI may be redesigned

---

## 1. DESIGN SYSTEM & VISUAL IDENTITY

### Verdict
**Partial coherent identity with heavy Material-UI dependency**

Viraha has a thoughtfully curated design system built on:
- **MUI v7.3.9** as primary component library
- **Framer Motion** for animations (12.34.0)
- **CSS-in-JS** via Emotion for styling
- **Three custom fonts** (TT Chocolates, Eastman, Posterama, ResotYc) — brand assets

### Theme & Color System
- **Primary color:** `#7B68EE` (purple) — clean, calm travel aesthetic
- **Secondary:** `#F0EBFF` (light purple tones)
- **Tertiary (accent):** `#D4A843` (gold/warm) — prosperity, discovery
- **Extended palette:** Virahа custom tokens (purple50–900, gold, journal cream, warm gray)
- **Dark mode:** Full CSS variables support with dual color schemes
- **M3 Shape scale:** 12px border radius (medium), 16px for cards, 28px for dialogs

### Typography
- **Body font:** TT Chocolates (regular, italic, medium, bold weights)
- **Headings:** TT Chocolates (also, not a separate display font — slightly unusual)
- **Brand/Logo font:** Posterama (semibold, bold)
- **Accent/Decorative:** ResotYc (serif, ornamental)

**Font sizing:** Uses MUI's h1–h6 with responsive scaling (no explicit Tailwind; MUI controls it)

### CSS Baseline & Utilities
- **Global CSS:** `/src/app/globals.css` defines:
  - Mobile-native resets (no pull-to-refresh, tap-flash, text-size auto-adjust)
  - Touch-action hints for horizontal scroll
  - MapLibre GL custom styles (popup transparency)
  - Gradient utilities (`.gradient-hero`, `.gradient-warm`, `.gradient-sunset`, `.text-gradient`)
  - Scrollbar hiding (`.hide-scrollbar`)
  - @keyframes for spin/ping animations

### Component Library Architecture
- **shadcn/ui-inspired custom components** in `/src/components/ui/` (Radix UI + Tailwind wrappers)
- **MUI Material components** for most app UX (buttons, dialogs, sheets, tabs, menus)
- **Lucide React** for iconography (0.564.0) — consistent, lightweight icon set

### Design System Verdict
✅ **Coherent.** Purple + gold, M3 shape language, custom fonts, full dark mode support.  
❌ **Mixed tooling.** MUI for core components, Tailwind-merge for utilities, custom CSS for gradients.  
⚠️ **Generic baseline.** Color choices are sophisticated but animations and card treatments are AI-standard (soft shadows, rounded corners, subtle scale-on-hover).

---

## 2. NAVIGATION: SIDEBAR & MOBILE MENUBAR (PRESERVED)

### Critical Files
- **Desktop sidebar:** `/src/components/layout/sidebar.tsx` — **MUST PRESERVE**
- **Mobile bottom nav:** `/src/components/layout/mobile-nav.tsx` — **MUST PRESERVE**
- **Header/footer:** `/src/components/layout/header.tsx`, `/src/components/layout/footer.tsx`

### Desktop Sidebar (`sidebar.tsx`)
**Structure:**
- Fixed left sidebar: 72px wide, purple primary background (`#7B68EE`)
- Rounded container: `borderRadius: 36px`, fixed inset with 20px/12px margins
- Box shadow: `0 8px 32px rgba(primary / 0.25)`

**Contents:**
1. **Logo** (top): White circular button (44×44) containing `<Waves>` icon in purple
2. **Nav items** (center, flex: 1):
   - Home, Explore, Map, Albums, Scrapbooks, Journals, Journeys, Saved, Atlas, Activity (10 items)
   - Active state: Animated white circular background (motion.div with spring animation)
   - Hover: `rgba(255,255,255,0.15)` background
   - Icons: Lucide React, 22×22, white (inactive) or purple (active)
3. **Travel mode toggle** (bottom):
   - Vertical pill button (38×68, 19px borderRadius)
   - Animated thumb icon slides between "Home" (local) and "Plane" (traveling)
   - Semi-transparent glass effect: `backdropFilter: blur(8px)`, border `rgba(255,255,255,0.15)`
4. **Profile avatar** (bottom):
   - 40×40 circular avatar with initials fallback
   - White background, purple text
   - Border highlight (white) when active

**Animation Details:**
- All state transitions: spring physics (`stiffness: 350, damping: 30`)
- Framer Motion `layoutId: "sidebar-active"` for shared element animation
- Travel toggle: Thumb squish on tap (`scaleX: 1.15, scaleY: 0.85`)

### Mobile Bottom Navigation (`mobile-nav.tsx`)
**Structure:**
- Fixed bottom bar: 64px height, rounded 32px, purple background
- Horizontal tabs with centered layout
- Safe area inset support: `pb: env(safe-area-inset-bottom, 0px)`
- Responsive display: `{ xs: 'block', md: 'none' }`

**Contents:**
1. **Primary tabs** (bottom nav bar):
   - Home, Explore, **Create (FAB)**, Map — 4 items
   - Create is a floating action button: white circle (48×48) with plus icon
   - Active state: Motion pill background (white, animated)
   - Labels below icons, small font (10px, fontWeight: 500)

2. **"More" items** (sheet accessed via Menu icon):
   - Albums, Scrapbooks, Journals, Journeys, Saved, Atlas, Activity (7 items)
   - Drawer opens from bottom with rounded top corners
   - 3-column grid layout inside sheet
   - Each item has icon + label, shows active state with background color

**Animation Details:**
- Active pill: `layoutId: "mobile-nav-pill"`, spring animation
- FAB hover/tap: `whileTap={{ scale: 0.9 }}, whileHover={{ scale: 1.05 }}`
- Sheet: Standard MUI Drawer with custom rounded top styling

### User Menu & Settings Access
- Profile avatar doubles as link to `/profile/[username]`
- Settings accessible via dedicated settings page: `/settings`
- No hamburger menu in main nav; all items explicitly visible on desktop/mobile

### Navigation Metrics
- **10 primary destinations** on desktop sidebar
- **4 + 1 FAB** on mobile bottom bar
- **7 secondary destinations** in mobile "More" sheet
- **Total unique routes:** 11 destinations across both forms

### Navigation Quality Assessment
✅ **Well-designed, modern, preserved.**  
✅ **Framer Motion animations feel responsive and snappy.**  
✅ **Accessible:** tooltips on desktop, clear labels on mobile.  
✅ **Dark mode support:** Full contrast handling.  
⚠️ **No keyboard shortcuts or command palette.**

---

## 3. PAGE ROUTES & PURPOSES

### App Routes (Authentication Required)

| Route | File Path | Purpose | Key Components | State/Data | Notes |
|-------|-----------|---------|-----------------|-----------|-------|
| `/home` | `(app)/home/page.tsx` | Dashboard/personalized homepage | DashboardHeader, DashboardGrid, 20+ widgets | Zustand: dashboard-store (layout, edit mode) | Editable widget layout, resizable cards |
| `/explore` | `(app)/explore/page.tsx` | Discover posts + trending locations + search | PostCard, MapLibre map, UserAvatar, search UI | TanStack Query: feed, posts, users, locations | Dual-mode: feed + side-map, trending section |
| `/feed` | `(app)/feed/page.tsx` | (Redirects to `/explore`) | — | — | Legacy alias |
| `/map` | `(app)/map/page.tsx` | Interactive world map of posts/journals | Dynamic MapLibre, TimelineScrubber, PlaceHistoryDrawer, filters | usePlaceResonance, useWantToGo, useNearbyFeed | Timeline scrubber, resonance pins, filter bar |
| `/albums` | `(app)/albums/page.tsx` | Gallery of user albums | AlbumGrid, AlbumCard, create button | useAlbums (infinite scroll) | Paginated grid, create modal |
| `/albums/[id]` | `(app)/albums/[id]/page.tsx` | Single album detail | Photos, metadata, edit | useAlbum | Post grid within album context |
| `/albums/[id]/edit` | `(app)/albums/[id]/edit/page.tsx` | Edit album metadata | Form, title, description, cover | useMutateAlbum | Settings form |
| `/journals` | `(app)/journals/page.tsx` | Journal collection browser | JournalGrid, JournalCard, search | useJournals, local search state | Searchable, custom color per journal |
| `/journals/[id]` | `(app)/journals/[id]/page.tsx` | Journal detail (all entries) | JournalEntryCard list, metadata | useJournal | Chronological or grouped by date |
| `/journals/[id]/entries/new` | `(app)/journals/[id]/entries/new/page.tsx` | Create journal entry | RichTextEditor, mood selector, location | useCreateJournalEntry | TipTap-powered WYSIWYG |
| `/journals/[id]/entries/[entryId]/edit` | `(app)/journals/[id]/entries/[entryId]/edit/page.tsx` | Edit entry | RichTextEditor, mood, location | useMutateJournalEntry | Same as create |
| `/create/post` | `(app)/create/post/page.tsx` | Create a post (photo + caption) | CreatePostForm, PhotoUpload, LocationAutocomplete | useCreatePost, file upload state | Multi-photo, location picker, privacy toggle |
| `/create/album` | `(app)/create/album/page.tsx` | Create new album | CreateAlbumForm | useCreateAlbum | Title, description, optional cover |
| `/create/journal` | `(app)/create/journal/page.tsx` | Create new journal | CreateJournalForm, ColorPicker | useCreateJournal | Title, initial color, icon |
| `/journeys` | `(app)/journeys/page.tsx` | User's detected/confirmed trips | Journey cards, timeline, detect button | useJourneys, useDetectJourneys | Auto-detected from posts, can confirm/edit |
| `/journeys/[id]/timeline` | `(app)/journeys/[id]/timeline/page.tsx` | Journey timeline (all posts) | Timeline view, posts filtered by journey | useJourney | Chronological posts for that trip |
| `/saved` | `(app)/saved/page.tsx` | Bookmarked posts | PostGrid filtered by saves | useSavedPosts | Infinite scroll of user's saved posts |
| `/atlas` | `(app)/atlas/page.tsx` | Travel statistics dashboard | Stats cards, continent progress, heatmap, travel style badge | useAtlas | Countries, cities, continents visited, stats |
| `/activity` | `(app)/activity/page.tsx` | Notification feed | Activity list items, follow requests, counters | useActivities, usePendingFollowRequests | Notifications for follows, comments, saves |
| `/post/[id]` | `(app)/post/[id]/page.tsx` | Post detail page | PostDetail, comments, lightbox, metadata | usePost, useComments | Full-res images, comment thread |
| `/profile/[username]` | `(app)/profile/[username]/page.tsx` | User profile | UserProfileHeader, tabs (posts/albums/journals), map | useUserProfile, useQuery posts/albums/journals | Tabbed interface, optional follow/block actions |
| `/settings` | `(app)/settings/page.tsx` | User preferences | Tabs: profile, appearance, security, data | useAuthStore, updateProfile, changePassword, deleteAccount | Settings form, theme toggle (light/dark/auto) |
| `/settings/blocked` | `(app)/settings/blocked/page.tsx` | Blocked users list | User list, unblock buttons | useBlockedUsers, useUnblockUser | Manage blocked accounts |
| `/scrapbooks` | `(app)/scrapbooks/page.tsx` | Collections of mixed content | ScrapbookGrid | useScrapbooks | **NEW** as of Jun 3 |
| `(app)/loading.tsx` | Skeleton loader | Fallback during server rendering | — | — | Page-level loading state |
| `(app)/not-found.tsx` | 404 page | Route not found | EmptyState | — | Generic not-found UI |
| `(app)/error.tsx` | Error boundary | Server/client error page | Error component | — | Recoverable error handling |

### Auth Routes (No Authentication Required)

| Route | File Path | Purpose | Key Components | Notes |
|-------|-----------|---------|-----------------|-------|
| `/sign-in` | `(auth)/sign-in/page.tsx` | Login form | Form, Google OAuth button, email/password | TIP-TAP editor not used; standard form |
| `/sign-up` | `(auth)/sign-up/page.tsx` | Registration | Form, Google OAuth, email verification prompt | Form validation via Zod |
| `/forgot-password` | `(auth)/forgot-password/page.tsx` | Password reset request | Email input form | Sends recovery link |
| `/reset-password` | `(auth)/reset-password/page.tsx` | Verify token + set new password | Password form, token validation | URL param token |
| `/verify-email` | `(auth)/verify-email/page.tsx` | Email verification | Code input, resend button | One-time code flow |
| `(auth)/error.tsx` | Error boundary (auth scope) | Auth-specific errors | Error component | Scoped to auth routes |

### Marketing Route (Unauthenticated)

| Route | File Path | Purpose | Key Components | Notes |
|-------|-----------|---------|-----------------|-------|
| `/` (root) | `page.tsx` | Redirects to auth or `/home` | — | Logic in root layout |
| `/landing-page.tsx` (implicit via marketing layout) | Landing page | Homepage hero, features, CTAs | HeroSection, FeatureCards, mock galleries, parallax | Beautiful animations, social proof |

### Page Loading/Error/Empty States

| Pattern | File | Implementation | Status |
|---------|------|-----------------|--------|
| Skeleton loaders | Inline in pages | `<Skeleton variant="rounded" animation="pulse" />` | ✅ Present in albums, journals, atlas |
| Error boundaries | `(app)/error.tsx`, `(auth)/error.tsx` | Standard Next.js error page | ✅ Implemented |
| Empty states | `(app)/not-found.tsx`, shared `EmptyState` | Custom `<EmptyState icon="..." title="..." />` component | ✅ Used in posts, journals, scrapbooks |
| Loading fallback | `(app)/loading.tsx` | Grid of skeleton cards | ✅ Skeleton grid for dashboard |

**Missing:** Progressive pagination indicators (infinite scroll shows spinners but no "loading more" bar).

---

## 4. KEY SHARED COMPONENTS & PATTERNS

### Card-Based Components

| Component | File Path | Purpose | Line Count | Quality | Notes |
|-----------|-----------|---------|-----------|---------|-------|
| PostCard | `/post/post-card.tsx` | Feed item: image, location, caption, actions | 465 | ⭐⭐⭐⭐ | Full interactive: saves, shares, report menu |
| AlbumCard | `/album/album-card.tsx` | Album preview grid item | 100+ | ⭐⭐⭐⭐ | Cover image, title overlay, gradient fallback |
| JournalCard | `/journal/journal-card.tsx` | Journal collection item | 200+ | ⭐⭐⭐⭐ | Custom color per journal, decorative icons, word count |
| JournalEntryCard | `/journal/journal-entry-card.tsx` | Entry in a journal list | 150+ | ⭐⭐⭐ | Summary preview, date, entry count |
| StatCard | `/shared/stat-card.tsx` | Stat display (numbers + label) | ~50 | ⭐⭐⭐ | Used in landing page |

### Form Components

| Component | File Path | Purpose | Notes |
|-----------|-----------|---------|-------|
| CreatePostForm | `/post/create-post-form.tsx` | Photo upload + metadata | 556 lines; Zod validation; location autocomplete; multi-file; privacy selector |
| CreateAlbumForm | `/album/create-album-form.tsx` | Album creation | Title, description, optional cover upload |
| CreateJournalForm | `/journal/create-journal-form.tsx` | Journal creation | Title, color picker, icon selector |
| JournalEntryEditor | `/journal/journal-entry-editor.tsx` | Rich text journal entry | TipTap-powered WYSIWYG |
| PhotoUpload | `/post/photo-upload.tsx` | Multi-file image uploader | Drag-drop, file preview, compression hints |

### Dialog/Overlay Components

| Component | File Path | Purpose | Notes |
|-----------|-----------|---------|-------|
| ImageLightbox | `/shared/image-lightbox.tsx` | Full-screen image carousel | 368 lines; keyboard nav (arrow keys), zoom (pin gesture on mobile), focus trap |
| ReportDialog | `/shared/report-dialog.tsx` | Report post/user | Modal, reason selector, submit |
| FollowListDialog | `/user/follow-list-dialog.tsx` | Followers/following list | Modular followers/following modal |
| AddToAlbumDialog | `/album/add-to-album-dialog.tsx` | Add post to album (modal) | Multi-select albums |
| WidgetCatalogDrawer | `/dashboard/widget-catalog-drawer.tsx` | Dashboard widget picker | Bottom sheet listing available widgets |

### Utility/Shared Components

| Component | File Path | Purpose | Notes |
|-----------|-----------|---------|-------|
| UserAvatar | `/shared/user-avatar.tsx` | User profile image | Avatar.sx fallback initials, auto-resolve URLs |
| LocationBadge | `/shared/location-badge.tsx` | Location display | City, country, or venue name + icon |
| UserProfileHeader | `/user/user-profile-header.tsx` | Profile page header | 352 lines; follower counts, follow/block buttons, stats |
| LocationAutocomplete | `/shared/location-autocomplete.tsx` | Place autocomplete input | Google Places API integration |
| EmptyState | `/shared/empty-state.tsx` | Empty list/grid fallback | Icon, title, description, optional button |
| SectionHeader | `/shared/section-header.tsx` | Section title + subtitle | Reusable page section heading |
| PhotoCarousel | `/shared/photo-carousel.tsx` | Embla-powered carousel | Image carousel with dot indicators |

### Map & Geolocation Components

| Component | File Path | Purpose | Lines | Notes |
|-----------|-----------|---------|-------|-------|
| Map | `/ui/map.tsx` | MapLibre GL wrapper | Custom | Dynamic import (SSR: false); custom controls |
| ResonancePin | `/map/resonance-pin.tsx` | Map marker visual | — | Custom styled pins with counts |
| TimelineScrubber | `/map/timeline-scrubber.tsx` | Timeline date scrubber | — | Slider to filter posts by date on map |
| PlaceHistoryDrawer | `/map/place-history-drawer.tsx` | Sidebar showing place visits | — | Location detail + posts at that place |

### Rich Text & Editor Components

| Component | File Path | Purpose | Notes |
|-----------|-----------|---------|-------|
| RichTextEditor | `/journal/rich-text-editor.tsx` | TipTap-based editor | Bold, italic, underline, text-align, image embed |
| EditorToolbar | `/journal/editor-toolbar.tsx` | Editor button toolbar | Floating toolbar for formatting |
| MoodSelector | `/journal/mood-selector.tsx` | Mood picker (emoji/text) | Emoji selection for journal entries |
| ColorPicker | `/journal/color-picker.tsx` | Journal color selector | Predefined color palette |

### Dashboard Widget Components

**Total:** 20 widgets, 4324 lines across all files  
**Pattern:** Each widget is a self-contained card component (motion.div), fetches its own data via hooks, handles loading/error states

| Widget | File | Purpose | Data Source | Resizable? |
|--------|------|---------|-------------|-----------|
| AlbumCarouselWidget | `album-carousel-widget.tsx` | Latest albums carousel | useAlbums | ✅ Yes |
| PhotoMosaicWidget | `photo-mosaic-widget.tsx` | Grid of recent photos | usePosts | ✅ Yes |
| StatsCountriesWidget | `stats-countries-widget.tsx` | Countries count + progress | useAtlas | ✅ Yes |
| StatsCitiesWidget | `stats-cities-widget.tsx` | Cities count + progress | useAtlas | ✅ Yes |
| TimelineWidget | `timeline-widget.tsx` | Timeline of recent posts | usePosts | ✅ Yes |
| JournalHighlightWidget | `journal-highlight-widget.tsx` | Last journal entry snippet | useJournals | ✅ Yes |
| AlbumPreviewWidget | `album-preview-widget.tsx` | Single album detail view | useAlbums | ✅ Yes |
| KindredTravelersWidget | `kindred-travelers-widget.tsx` | Suggested follows (travelers) | useFollows | ✅ Yes |
| StreakWidget | `streak-widget.tsx` | Daily posting streak | useViraha | ✅ Yes |
| QuoteWidget | `quote-widget.tsx` | Inspiring travel quote | Static/API | ✅ Yes |
| OnThisDayWidget | `on-this-day-widget.tsx` | Posts from this date last year | usePosts (date filter) | ✅ Yes |
| MiniMapWidget | `mini-map-widget.tsx` | Small MapLibre preview | useMapMarkers | ✅ Yes |
| ContinentProgressWidget | `continent-progress-widget.tsx` | Visited continents progress | useAtlas | ✅ Yes |
| **15+ others** | — | Travel stats, time capsules, seasonal reflections, want-to-go lists, etc. | — | ✅ Yes |

**Dashboard Quality:** ⭐⭐⭐⭐  
Modern drag-drop reordering (dnd-kit), resizing popover, persistence via Zustand, beautiful animations, responsive grid.

---

## 5. STATE MANAGEMENT & DATA LAYER

### State Management Libraries

| Store | File Path | Purpose | Pattern | Hydration |
|-------|-----------|---------|---------|-----------|
| `auth-store` | `/stores/auth-store.ts` | User login state, user object | Zustand + hydration gate | localStorage (useAuthHydrated) |
| `dashboard-store` | `/stores/dashboard-store.ts` | Widget layout, edit mode, colors | Zustand + localStorage | Rehydration skeleton shown |
| `journal-colors-store` | `/stores/journal-colors-store.ts` | Per-journal color assignments | Zustand | In-memory |
| `travel-store` | `/stores/travel-store.ts` | Travel mode (local/traveling), current location | Zustand + sync with backend | Via useUpdateTravelMode mutation |
| `quiet-mode-store` | `/stores/quiet-mode-store.ts` | Do-not-disturb toggle | Zustand | — |

### API Client & Data Fetching

| Layer | File Path | Tools | Pattern |
|-------|-----------|-------|---------|
| HTTP Client | `/api/client.ts` | Axios + CSRF | createClient() with interceptors |
| Endpoints | `/api/*.ts` (activities, albums, auth, comments, explore, feed, follows, journals, journeys, map, media, places, posts, reports, saves, scrapbooks, time-capsules, travel, users, viraha, want-to-go) | TanStack Query + Axios | Fetch functions per domain |
| Query Hooks | `/hooks/use-*.ts` (25+ custom hooks) | TanStack React Query v5 | useQuery, useInfiniteQuery, useMutation |
| Error Handling | Inline in hooks | Sonner (toast notifications) | onError callbacks with toast.error() |

### TanStack Query Setup

- **Version:** 5.90.21
- **Pattern:** useQuery/useInfiniteQuery for reads, useMutation for writes
- **Cache keys:** Hierarchical (e.g., `['posts', 'user', userId]`)
- **Invalidation:** Manual via queryClient.invalidateQueries after mutations
- **Pagination:** `useInfiniteQuery` with `hasNextPage`/`fetchNextPage` for infinite scroll

### Provider Stack

| Provider | File Path | Purpose |
|----------|-----------|---------|
| QueryProvider | `/providers/query-provider.tsx` | TanStack Query client + config |
| ThemeProvider | `/providers/theme-provider.tsx` | Next Themes (light/dark/auto) + MUI integration |
| MuiThemeProvider | `/providers/mui-theme-provider.tsx` | MUI createTheme + CSS variables |

**App layout** wraps all providers in `(app)/layout.tsx` and `(auth)/layout.tsx`.

---

## 6. TOP 10 GENERIC/WEAK COMPONENTS — REDESIGN PRIORITIES

### High-Impact Redesign Targets

| # | Component | File Path | Current State | Why Weak | Redesign Priority |
|---|-----------|-----------|----------------|----------|-------------------|
| 1 | **Dashboard Grid Layout** | `/dashboard/dashboard-grid.tsx` | Standard CSS Grid with MUI Skeleton | Generic AI-generated look; limited visual hierarchy between widget types | ⭐⭐⭐⭐⭐ HIGH |
| 2 | **Feed/Explore Page Layout** | `(app)/explore/page.tsx` | 2-column (feed + map) with horizontal sections | Crowded, no visual breathing room, trending section is flat | ⭐⭐⭐⭐⭐ HIGH |
| 3 | **Album/Journal Grids** | `(app)/albums/page.tsx`, `(app)/journals/page.tsx` | Standard card grids with subtle shadows | Looks like every other photo app; no personality | ⭐⭐⭐⭐ MEDIUM-HIGH |
| 4 | **Post Card Design** | `post-card.tsx` | White/dark card with image, caption, action row | Uninspired; actions are cramped in bottom row (save, comment, share buttons) | ⭐⭐⭐⭐ MEDIUM-HIGH |
| 5 | **Profile Page Tabs** | `(app)/profile/[username]/page.tsx` | MUI Tabs with underline indicator | Generic MUI styling; tab content layout is vertical stacks | ⭐⭐⭐ MEDIUM |
| 6 | **Settings Page** | `(app)/settings/page.tsx` | Tab-based form sections (profile, appearance, security) | Boring form layout; no visual distinction between sections | ⭐⭐⭐ MEDIUM |
| 7 | **Auth Pages** | `(auth)/sign-in/page.tsx`, `sign-up`, etc. | Centered form with email/password fields + OAuth button | Minimal branding; password reset flow is hidden in link | ⭐⭐⭐ MEDIUM |
| 8 | **Activity/Notifications Page** | `(app)/activity/page.tsx` | List of activity items with icon + text + timestamp | No grouping by date/type; limited visual distinction | ⭐⭐⭐ MEDIUM |
| 9 | **Map Filter Bar** | `(app)/map/page.tsx` (FilterBar component) | MUI Select dropdowns for type/scope filters | Disconnected from map experience; no inline feedback | ⭐⭐ MEDIUM-LOW |
| 10 | **Empty States** | `shared/empty-state.tsx` | Icon + title + description + optional button | Placeholder-like; no contextual messaging or next-step guidance | ⭐⭐ MEDIUM-LOW |

### Detailed Rationales

#### 1. Dashboard Grid (CRITICAL)
- **Current:** Static grid of 20 resizable widgets, each is a plain rounded card
- **Problem:** No visual differentiation between widget types; feels like a generic analytics dashboard; the color customization per widget doesn't make up for bland typography and spacing
- **Opportunity:** Design for storytelling — highlight the "Kindred Travelers" widget, make timeline/map widgets more visually prominent, introduce a clearer visual hierarchy based on content type

#### 2. Explore/Feed (CRITICAL)
- **Current:** Split-screen with feed on left (narrow), map/trending on right (sidebar), trending locations as horizontal scroll below
- **Problem:** Wasted screen real estate; trending section is an afterthought; the dual-sidebar experience is not optimized for mobile
- **Opportunity:** Redesign for multi-device: consider single-column on mobile with bottom tabs, rethink what "trending" means (real-time, weekly, community-driven?), make the map more interactive/full-screen option

#### 3. Album/Journal Grids (HIGH)
- **Current:** Standard 3-4 column grid of cards with image + title overlay
- **Problem:** Looks like Google Photos, Instagram, or every other travel app; custom colors on journals are nice but underutilized; no narrative flow
- **Opportunity:** Introduce creative layouts (masonry, varied aspect ratios, cinemagraph-style animations), emphasize the "collection" narrative, add richer previews (mini-grid of photos in album)

#### 4. Post Card (HIGH)
- **Current:** Image + location badge + caption (truncated) + action row (save, comment, share, more menu)
- **Problem:** Actions are crowded; "more menu" hides important actions (report, hide); caption truncation is abrupt; no character or personality
- **Opportunity:** Redesign action layout (swipe-up on mobile?), make post metadata discoverable, add rich previews (if post is part of an album, show album context), experiment with caption reveal mechanics

#### 5. Profile Page (MEDIUM)
- **Current:** Header with avatar, bio, stats + MUI Tabs for Posts / Albums / Journals + optional Map tab
- **Problem:** Tabs are generic; tab switching feels flat; stats are not visually prominent enough
- **Opportunity:** Redesign header to be more impactful (use cover image?), integrate stats into tab navigation, experiment with tab-less navigation (horizontal scroll sections?), make the map tab visually rich

#### 6. Settings (MEDIUM)
- **Current:** Left sidebar tab nav (Profile, Appearance, Security, Data) with form fields for each
- **Problem:** Boring form layout; no visual hierarchy between settings; theme toggle is just a MUI Switch
- **Opportunity:** Redesign for mobile-first (vertical stacking?), use rich previews for theme (light/dark/auto with visual indicators), add inline help, introduce a "quick settings" card

#### 7. Auth Pages (MEDIUM)
- **Current:** Centered form (email, password, confirm) with Google OAuth button, forgot password link
- **Problem:** No brand story; minimal visual interest; password reset is indirect (link in form)
- **Opportunity:** Redesign with better copy (why Viraha?), add brand imagery or gradient, make OAuth button more prominent, integrate password reset into the flow

#### 8. Activity Feed (MEDIUM)
- **Current:** Chronological list of activity items (follow, comment, save) with icon + user avatar + message + timestamp
- **Problem:** No grouping by date or type; not skimmable; follow requests are mixed in with notifications
- **Opportunity:** Group by date (Today, This Week, Earlier), differentiate activity types visually (follow requests highlighted), add rich previews (posts that were saved/commented on)

#### 9. Map Filter Bar (MEDIUM-LOW)
- **Current:** Two MUI Select dropdowns (Type: All/Posts/Journals, Scope: Everyone/My Content)
- **Problem:** Disconnected from map; filters don't provide visual feedback; no inline help
- **Opportunity:** Make filters more discoverable (bottom sheet on mobile?), add visual legend for post vs journal pins, show filter result count

#### 10. Empty States (MEDIUM-LOW)
- **Current:** Icon (generic Lucide icon) + title + description + optional button
- **Problem:** Generic placeholder feel; doesn't guide user to next step
- **Opportunity:** Context-specific messaging (e.g., "No albums yet. Create one to group photos from a trip"), visual cues (e.g., show a mini tutorial), add CTA button consistently

---

## 7. COMPONENT QUALITY SCORECARD

### High Quality (⭐⭐⭐⭐⭐)
- **Sidebar & Mobile Nav:** Thoughtfully animated, well-structured, excellent mobile UX
- **Dashboard Widgets:** Diverse, self-contained, good data loading patterns
- **PostCard & ProfileHeader:** Comprehensive interactive states (save, follow, block, report)
- **ImageLightbox:** Full keyboard/touch support, focus trapping, zoom capability
- **CreatePostForm:** Complex form with photo upload, location picker, validation

### Medium Quality (⭐⭐⭐)
- **Album/Journal Cards:** Solid but generic; custom colors don't redeem the bland structure
- **Activity Page:** Functional but lacks visual hierarchy
- **Settings Page:** Comprehensive but boring layout

### Weak Quality (⭐⭐)
- **Empty States:** Too generic, minimal guidance
- **Map Filter Bar:** Disconnected from experience

---

## 8. TYPOGRAPHY & SPACING PATTERNS

### Heading Hierarchy
- **h1:** 2–3rem, fontFamily: `var(--font-heading)`, fontWeight: 700, letterSpacing: `-0.025em`
- **h5:** 1.5rem, fontWeight: 600
- **Section titles:** Vary; some use h3, others use custom sizing

### Body Text
- Default: 14–16px, `var(--font-body)`, color: `text.primary` or `text.secondary`
- **Captions:** 12–13px, color: `text.secondary`

### Spacing Scale (MUI)
- Gutters: 16px (md), 8px (xs)
- Gaps between items: 8px (0.5), 16px (1), 24px (1.5), 32px (2)
- Section padding: 16–32px (xs), 24–48px (md)

---

## 9. ANIMATIONS & MOTION

### Framer Motion Patterns
- **Entry animations:** `initial={{ opacity: 0, y: 8–16 }}`, `animate={{ opacity: 1, y: 0 }}`
- **Spring physics:** `type: 'spring', stiffness: 350, damping: 30` (standard across nav, cards, modals)
- **Shared layout animations:** `layoutId` used for sidebar active pill, mobile nav pill, image lightbox transitions
- **Hover effects:** Scale, shadow elevation, color change
- **Tap effects:** Scale (0.9x on tap), restore on release

### Global Animations
- **Spin:** @keyframes spin (0° → 360°)
- **Ping:** @keyframes ping (scale 2x + fade out)

### Motion Verdict
Motion is well-integrated but sometimes feels over-animated (dashboard cards all have spring entries, can feel busy).

---

## 10. MOBILE RESPONSIVENESS

### Breakpoints (MUI)
- `xs`: 0px
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px

### Layout Patterns
- **Desktop:** Sidebar (fixed left) + main content
- **Mobile (< md):** Bottom nav bar + full-width content, sidebar hidden
- **Safe area:** Drawer padding uses `env(safe-area-inset-bottom)`
- **Images:** Responsive sizing via Next.js Image component

### Mobile Issues Found
- None critical; layout is well thought out
- Safe area insets properly applied for iOS notch/dynamic island

---

## FINAL SUMMARY: DESIGN SYSTEM VERDICT

### What Works
1. **Coherent color palette** (purple + gold + accents)
2. **Well-preserved navigation** (sidebar + mobile bottom nav with excellent UX)
3. **Custom fonts** add personality (TT Chocolates, Eastman, Posterama)
4. **Full dark mode support** with CSS variables
5. **Excellent motion design** with Framer Motion
6. **Responsive breakpoints** with mobile-first thinking
7. **Comprehensive component library** (MUI + custom shadcn-style components)

### What Needs Redesign
1. **Dashboard experience** — too generic for a lifestyle/memory app
2. **Feed/Explore layout** — cramped and uninspired
3. **Card designs** — look like every other social app
4. **Profile/settings pages** — minimal visual interest
5. **Overall personality** — lacks the warmth/intimacy of Viraha's "memory" positioning

### Recommended Redesign Approach
- **Keep:** Navigation (sidebar + mobile bottom nav), color palette, fonts, dark mode infrastructure, motion library
- **Redesign:** All page layouts, card treatments, empty states, form UX, dashboard experience
- **New:** Visual identity for memory/nostalgia (warmer spacing, richer typography, illustrated elements, seasonal/emotional motifs)

---

## FILE PATHS (QUICK REFERENCE)

### Navigation (PRESERVED)
- `/src/components/layout/sidebar.tsx`
- `/src/components/layout/mobile-nav.tsx`

### Design System
- `/src/lib/theme.ts` (MUI theme tokens)
- `/src/app/globals.css` (global styles, fonts, utilities)
- `/src/components/ui/` (shadcn-style components)

### Key Pages
- `/src/app/(app)/home/page.tsx` (dashboard)
- `/src/app/(app)/explore/page.tsx` (feed + map)
- `/src/app/(app)/profile/[username]/page.tsx` (profile)
- `/src/app/(app)/albums/page.tsx` (album grid)
- `/src/app/(app)/journals/page.tsx` (journal grid)
- `/src/app/(app)/settings/page.tsx` (settings)

### Data Layer
- `/src/lib/api/` (API endpoints)
- `/src/lib/hooks/` (TanStack Query hooks)
- `/src/lib/stores/` (Zustand stores)
- `/src/lib/providers/` (React context providers)

### Component Library
- `/src/components/post/` (post cards, forms, detail)
- `/src/components/album/` (album cards, grids, forms)
- `/src/components/journal/` (journal cards, editor, forms)
- `/src/components/dashboard/` (dashboard header, grid, 20+ widgets)
- `/src/components/shared/` (utilities: avatar, badge, lightbox, empty state)
- `/src/components/ui/` (base components: button, card, dialog, etc.)
- `/src/components/user/` (profile header, follow list dialog)
- `/src/components/map/` (map wrapper, pins, timeline scrubber)

---

**Report Generated:** June 9, 2026  
**Inventory Complete:** 11 app routes, 5 auth routes, 1 marketing route, 60+ shared components, 20 dashboard widgets, full design system documented.

