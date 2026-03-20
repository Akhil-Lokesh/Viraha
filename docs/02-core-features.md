# Core Features

## Content Types

Viraha supports four distinct content types, each serving a different purpose in documenting travel.

### 1. Posts
**Quick moments that capture a place or experience**

**Purpose**: Lightweight, immediate documentation of single experiences

**Components**:
- 1-10 photos or videos
- Text caption (optional, up to 2000 characters)
- Location pin (required)
- Date/time (auto-captured or manual)
- Privacy setting (public/followers/private)
- Tags (optional)

**Use Cases**:
- "Amazing sunset at Santorini"
- "Best ramen I've ever had"
- "Hidden waterfall we stumbled upon"

**Features**:
- Swipe through photos
- Tap location to see map
- Save to your scrapbook
- Share to followers or make public

---

### 2. Albums
**Curated photo collections from a trip or theme**

**Purpose**: Visual storytelling through photo collections

**Components**:
- Collection of 5-100 photos
- Album title and description
- Cover photo (auto-selected or manual)
- Location(s) - can span multiple places
- Date range
- Optional captions per photo
- Privacy settings

**Use Cases**:
- "Japan: Two Weeks"
- "Architecture of Barcelona"
- "Hiking the Inca Trail"
- "Street Food Adventures - Southeast Asia"

**Features**:
- Drag-and-drop photo ordering
- Grid or slideshow view
- Map showing all album locations
- Download full album
- Collaborative albums (future)

---

### 3. Journals
**Day-by-day narratives of a trip**

**Purpose**: Detailed trip documentation with daily structure

**Components**:
- Trip title and summary
- Start and end dates
- Daily entries with:
  - Date heading
  - Text content (markdown supported)
  - Photos/videos inline
  - Location per day or entry
  - Weather (optional, auto-filled)
  - Mood tag (optional)
- Route map showing the journey
- Privacy settings (per journal or per entry)

**Use Cases**:
- "2 Weeks Through Patagonia"
- "Solo Backpacking Europe: My First Trip"
- "Family Road Trip Across Route 66"

**Features**:
- Rich text editor with markdown
- Embed photos inline with text
- Auto-generate from posts/albums (optional)
- Export to PDF or print-ready format
- Timeline view showing progression

**Special Capabilities**:
- Draft mode: Write during or after trip
- Auto-save as you write
- Suggests posts/albums from same dates
- Can pull weather data automatically

---

### 4. Scrapbook
**Your personal travel canvas**

**Purpose**: Private collection of saved inspiration and memories

**Components**:
- Saved posts from others
- Your own posts/albums/journals
- External links (blog posts, articles)
- Notes and ideas
- "Want to go" places
- Organizational folders/tags

**Use Cases**:
- Planning next trip
- Saving inspiration
- Organizing by theme ("Beach towns", "Mountain hikes")
- Private reflection space

**Features**:
- Infinite scroll canvas
- Drag to reorder
- Folder organization
- Search your scrapbook
- Export collections
- **Always private** - scrapbook is never shared

---

## Map Integration (MAPCN)

**Philosophy**: Map As Primary Canvas (mapcn)

The map isn't just a feature - it's the primary way to navigate your travel story.

### Map Modes

**1. World View**
- Clustered pins showing content density
- Heat map of your travels
- Timeline scrubber at bottom
- Filter by content type

**2. Region View**
- Individual pins expand
- Shows preview thumbnails
- Nearby content suggestions

**3. Detail View**
- Full content preview on tap
- Nearby posts from you and others
- "What else is here?" discovery

### Map Features

- **Your Footprint**: Visualize everywhere you've been
- **Timeline Travel**: Scrub through time to see journey progression
- **Heatmap Mode**: See where you've spent the most time
- **Route Lines**: Connect chronological posts to show path
- **Explore Mode**: Browse others' content by location
- **Offline Mode**: Downloaded regions available offline

### Context-Aware Display

**When viewing map**:
- Dense areas → Show clusters
- Sparse areas → Show individual pins
- Zoom in → Reveal more detail
- Tap cluster → Zoom and expand

**When creating content**:
- Auto-suggest location based on GPS
- Show nearby posts you've made
- "Same place as previous post?" quick option

---

## Dual Mode System

### Local Mode (Default)
**When you're at home or not actively traveling**

**Interface Focus**:
- Browse and organize existing content
- Explore feed and discovery
- Plan future trips
- Reflect on past journeys

**Features Available**:
- Full map browsing
- Feed scrolling
- Scrapbook organization
- Profile editing
- Discovery and search
- Following/social features

**UI Characteristics**:
- Relaxed, browsing-optimized
- Larger text and spacing
- Emphasis on reading and reflection

---

### Traveling Mode (GPS-Activated)
**When the app detects you're away from home base**

**Auto-Activation Triggers**:
- 50+ miles from home location
- Consecutive days in new location
- Manual toggle available

**Interface Focus**:
- Quick content capture
- Minimal friction posting
- Location tagging priority
- Offline-first functionality

**Features Available**:
- Quick post creation
- Photo uploads (queued if offline)
- Location auto-tagging
- Today's journal entry
- Nearby discovery (WiFi only)

**UI Characteristics**:
- Streamlined, capture-focused
- Larger tap targets
- One-handed operation optimized
- Battery-conscious design
- Works offline, syncs when connected

**Mode Switching**:
- Smooth transition animation
- Confirmation prompt first time
- Manual override always available
- Remembers preference per trip

---

## Feed & Discovery

### Your Feed

**Content Sources** (in order):
1. Your own recent posts
2. Posts from people you follow
3. Posts from places you've been
4. Suggested content based on interests

**Filtering**:
- Show only: Posts / Albums / Journals
- From specific people
- From specific locations/regions
- Time period

**No Algorithmic Ranking of Social Content**:
- Chronological from people you follow
- Suggested content clearly labeled
- No hidden manipulation
- Transparent why you're seeing something

### Discovery

**Explore Page**:
- Trending locations (based on recent activity)
- Featured travelers (community highlights)
- Thematic collections ("Coastal Towns", "Mountain Retreats")
- Recent from your network

**Search**:
- Search by location
- Search by keyword/tag
- Search by username
- Filter results by content type
- Save searches for later

**Browse Map**:
- Explore anywhere in the world
- See public content from that location
- Filter by content type
- See popular vs recent

---

## Social Features

### Following System

**Philosophy**: Follow people whose travel taste you trust

- No follower counts displayed publicly
- Following is mutual or one-way
- Your followers can't see who else you follow (privacy)
- Can follow specific content types from a person

**Discovery**:
- Suggested based on places you've both been
- Suggested based on mutual follows
- Can search for travelers

### Engagement

**What you CAN do**:
- Save to your scrapbook
- Comment on posts
- Share to your followers
- Send direct appreciation

**What you CANNOT do**:
- Like (no like counts)
- Rate/review
- Publicly rank or score

**Comments**:
- Threaded conversations
- Creator can moderate
- Can be disabled per post
- Notification controls

### Privacy Controls

**Per-Content Privacy**:
- **Private**: Only you
- **Followers**: People who follow you
- **Public**: Anyone can discover

**Profile Privacy**:
- Public profile (discoverable)
- Private profile (followers only, must approve)
- Ghost mode (content only visible to you)

**Granular Control**:
- Hide location details (show city, not exact pin)
- Hide dates
- Hide from explore/search
- Block specific users

---

## Content Creation Flow

### During Travel (Traveling Mode)

1. **Capture Moment**
   - Tap camera icon
   - Take photo or select from gallery
   - Location auto-tagged
   - Quick caption (optional)
   - Post immediately or save draft

2. **Quick Post**
   - Swipe gestures for common actions
   - One-tap location confirm
   - Default privacy remembered
   - Minimal steps to publish

3. **End of Day**
   - Notification: "How was today?"
   - Quick journal entry option
   - Reviews photos from today
   - Can batch-create posts

### After Travel (Local Mode)

1. **Organize Trip**
   - Create album from trip photos
   - Write journal retroactively
   - Add context to quick posts
   - Tag and categorize

2. **Reflect and Share**
   - Polish journal entries
   - Choose best photos for albums
   - Decide what to share publicly
   - Add thoughtful captions

3. **Curate**
   - Organize scrapbook
   - Update profile
   - Connect with fellow travelers
   - Plan next journey

---

## Key Feature Principles

1. **Capture > Curate > Share**
   - Make it effortless to capture during the moment
   - Give time and tools to curate well
   - Make sharing optional and intentional

2. **Mobile-First, Desktop-Enhanced**
   - Primary capture on mobile
   - Detailed editing on desktop
   - Full experience on both

3. **Offline-First Architecture**
   - Core features work offline
   - Queue actions for when connected
   - Never lose content

4. **Privacy by Design**
   - Default to private
   - Explicit consent to share
   - Easy privacy management

5. **No Dark Patterns**
   - No manipulation to post more
   - No FOMO-inducing features
   - No gamification
   - Transparent algorithms
