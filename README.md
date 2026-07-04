# Project J — EnyuUniverse 🌌

> **父子共创的数字成长花园** | A father-son digital growth garden

A private, local-first web application that serves as a living archive of Enyu (渊裕)'s creative universe — his drawings, world-building lore, travel memories, and life dreams — all enriched with AI-guided co-creation tools.

---

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Styling | Vanilla CSS + Tailwind CSS v4 |
| Fonts | Google Fonts — Outfit, Lora, Inter |
| Markdown | react-markdown + remark-gfm |
| AI Backend | DeepSeek API (server-side proxy) |
| Storage | localStorage (local-first, no server DB required) |
| Animation | canvas-confetti |
| Icons | lucide-react |

---

## 📁 Project Structure

```
src/
├── app/
│   ├── page.tsx                  # Homepage dashboard
│   ├── layout.tsx                # Root layout (Navbar + MobileNav)
│   ├── globals.css               # Design tokens & global styles
│   │
│   ├── artworks/
│   │   ├── page.tsx              # Creation Hall — artwork list & filters
│   │   ├── [id]/page.tsx         # Artwork detail — Markdown + AI companion + co-creation chat
│   │   └── review/page.tsx       # Local image review dashboard + AI critique
│   │
│   ├── achievements/
│   │   └── page.tsx              # Achievement badge wall (21 badges, 6 categories)
│   │
│   ├── dreams/
│   │   └── page.tsx              # Dream Archive — goals, confetti celebration, reflections
│   │
│   ├── labs/
│   │   └── page.tsx              # Guided Labs Engine — 4 creative templates with empathy prompts
│   │
│   ├── timeline/
│   │   └── page.tsx              # Growth Rings — chronological life & creation milestones
│   │
│   ├── travel/
│   │   ├── page.tsx              # Travel Hall — plans, stories, blogs, albums
│   │   └── [id]/page.tsx         # Travel detail — Markdown diary + co-creation chat
│   │
│   ├── worldbuilding/
│   │   └── page.tsx              # World & Character archives with portrait illustrations
│   │
│   └── api/
│       ├── companion/route.ts    # POST — DeepSeek story companion & empathy question engine
│       ├── images/route.ts       # GET — scan art-work/ directory tree
│       ├── images/analyze/route.ts  # POST — Python feature extraction + DeepSeek art critique
│       └── images/[...path]/route.ts # GET — serve local optimized images
│
├── components/
│   ├── navbar.tsx                # Top navigation bar with role switcher
│   └── mobile-nav.tsx            # Bottom Tab Bar for mobile/tablet (md:hidden)
│
└── lib/
    ├── db.ts                     # Local-first mock database (localStorage wrapper)
    └── gdrive.ts                 # Google Drive mock upload layer
```

---

## 👥 User Roles

| Role | Chinese | Permissions |
|---|---|---|
| `Child` | 渊裕 (Enyu) | Full create/edit/delete, manage visibility |
| `Father` | 爸爸 | Full read, co-create chat, add timeline events |
| `Mother` | 妈妈 | View public + family content, read-only |
| `Guest` | 访客 | Public artworks only; blocked from dreams, private travel, chats |

Switch roles using the dropdown in the top-right corner of the navbar (dev/demo mode).

---

## 📦 Key Features

### 🎨 Creation Hall (`/artworks`)
- Filter by type: hand-drawn, comic, novel, sci-fi, wargame, mystery, worldview
- Markdown rendering with `react-markdown` + `remark-gfm`
- Public/private visibility toggle per artwork
- AI Blueprint Gallery carousel (e.g. Nano Banana 2 spacecraft variants)

### 🤖 AI Story Companion
- Calls DeepSeek API server-side (`/api/companion`) to generate 3–4 open-ended questions
- **Empathy Module**: auto-triggers perspective-shift prompts when conflict/war content detected
- Click-to-insert questions directly into the co-creation chat

### 🖼️ AI Art Critique (`/artworks/review`)
- Python script extracts visual features (brightness, contrast, line density, color palette)
- DeepSeek generates persona-based critique: Art Director / Comics Editor / Calligraphy Supervisor / Tactics Coach
- Graceful offline fallback with rich mock feedback when API key is absent

### 🧳 Travel Hall (`/travel`)
- 4 content types: Plan (旅行计划), Story (游记故事), Blog (出行随笔), Album (精彩瞬间)
- Seeded with real family trips: Mount Tai climb, Qinghai Northwest expedition plan, Chongli ski trip
- Detail page with full Markdown rendering and family-only co-creation chat

### 🏆 Achievement System (`/achievements`)
- **21 badges** across 6 categories: Creation, Travel, World, Dream, Social, Special
- 3 rarity tiers: Common / Rare / Legendary
- Progress bars for in-progress badges; confetti celebration on unlock
- "Next targets" panel shows the 3 badges closest to unlock
- Homepage progress strip with mini progress bar

### 📱 Mobile Navigation
- Fixed bottom Tab Bar (`src/components/mobile-nav.tsx`) — visible only on screens smaller than `md`
- 5 primary tabs: Creation Hall, Lab, Worldview, Travel, Dreams

### 🌍 World Building (`/worldbuilding`)
- World archives and character dossiers with portrait illustrations
- Characters capture: name, personality, dream, fatal weakness, related artworks

### ⭐ Dream Archive (`/dreams`)
- Set personal goals with target dates
- Mark as achieved → confetti explosion (`canvas-confetti`)
- Write post-achievement reflections

### 📅 Growth Rings (`/timeline`)
- Chronological milestones: school, life, creative events
- Links timeline nodes back to specific artwork pages

### 🔬 Labs Engine (`/labs`)
- 4 guided creative templates: Empire Lab, Strategy Lab, Mystery Workshop, Sci-Fi Lab
- Built-in Empathy Reflection Module with perspective-shifting prompts
- Auto-generates structured Markdown document in Creation Hall

---

## 🧠 Database Architecture

`src/lib/db.ts` implements a **local-first persistent database** backed by `localStorage`.

### Data Types

| Type | Description |
|---|---|
| `User` | Family member profiles with roles |
| `Artwork` | All creative works with visibility, tags, gallery images |
| `Conversation` | Co-creation chat messages tied to artworks or travel entries |
| `Character` | World-building character dossiers with portrait image URLs |
| `World` | World-building universe frameworks |
| `TimelineEvent` | Growth Ring chronological milestones |
| `Dream` | Personal goal tracking with reflections |
| `TravelEntry` | Travel logs (plan / story / blog / album) |
| `Achievement` | Computed badges (derived from live data, not stored) |

### Auto-Migration
On every page load, `loadFromStorage()` runs a **user record migration** that force-syncs display names and emails from `DEFAULT_USERS` to fix any stale cached data (e.g. old names from previous sessions).

---

## 🖼️ Image Assets

All AI-generated illustrations are in `public/`:

| File | Description |
|---|---|
| `char_lothar.png` | General Lothar — stormy canyon, sepia watercolor |
| `char_alto.png` | Alto the Wind Mage — ruins exploration, antique watercolor |
| `nano_banana_2_warp.png` | Nano Banana 2 spacecraft — warp jump |
| `nano_banana_2_station.png` | Nano Banana 2 — steampunk orbital station |
| `nano_banana_2_planet.png` | Nano Banana 2 — gas giant cruise |
| `travel_taishan.png` | Father & son at Mount Tai sunrise |
| `travel_qinghai.png` | Brachiosaurus at Chaka Salt Lake (渊裕's concept art) |
| `travel_skiing.png` | Chongli ski slope illustration |
| `banana.png` | Nano Banana 2 main artwork cover |
| `castle.png` | Mystery castle cover image |
| `dino.png` | Brachiosaurus dinosaur cover |

Raw high-resolution scans are stored in `art-work/` (git-ignored). Only optimized assets in `public/` are tracked.

---

## ⚙️ Environment Variables & Google Drive Sync

To enable the hybrid Google Drive uploader, configure the following variables.

### 1. Local Development (`.env.local`)
Create `.env.local` in the project root:

```env
# DeepSeek API Configuration (AI Companion / Critique)
DEEPSEEK_API_KEY=your_deepseek_api_key
DEEPSEEK_ANALYSIS_MODEL=deepseek-chat

# Google Drive OAuth2 Credentials
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_DRIVE_PARENT_FOLDER_ID=your_shared_google_drive_folder_id
```

All AI features and Drive uploads gracefully degrade to mock offline handlers if variables are absent.

### 2. Generating the Google Refresh Token
Once `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are configured:
1. Make sure your local server is running (`npm run dev`).
2. Go to Google Cloud Console and add `http://localhost:3000/api/auth/callback` to the **Authorized redirect URIs** of your OAuth client.
3. Open **[http://localhost:3000/api/auth/google](http://localhost:3000/api/auth/google)** in your browser and authorize access.
4. The system will retrieve the `refresh_token` and automatically append it to your `.env.local` as `GOOGLE_REFRESH_TOKEN`.

---

## ☁️ Vercel Free-Tier Cloud Deployment

When deploying EnyuUniverse to Vercel, the temporary serverless filesystem is read-only. Setting up the Google Drive integration is required to prevent files from disappearing when Vercel containers restart.

### Steps to Deploy:
1. **Push to GitHub**: Commit your codebase (credentials in `.env.local` are automatically ignored by git).
2. **Import Project to Vercel**: Connect your GitHub repository to Vercel.
3. **Configure Redirect URIs**:
   - Go to Google Cloud Console > Credentials and edit your OAuth Web Client.
   - Under **Authorized redirect URIs**, add your live Vercel domain callback path:
     `https://<your-project-name>.vercel.app/api/auth/callback`
4. **Add Environment Variables**:
   In the Vercel project settings, add the following variables:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_DRIVE_PARENT_FOLDER_ID`
   - `GOOGLE_REFRESH_TOKEN` (Copy the string generated in Step 2 from your local `.env.local` file)
   - `DEEPSEEK_API_KEY` (Optional)
5. **Redeploy**: Trigger a deploy. Your son will now be able to upload artwork directly to Google Drive without ever seeing a Google authentication prompt.

---

## 🔒 Privacy Model

- **Private** content: visible only to `Child`, `Father`, `Mother`
- **Public** content: visible to all roles including `Guest`
- Dreams page: fully blocked for `Guest` role
- Travel detail: `Guest` redirected away from private entries
- Co-creation chat: hidden from `Guest` in all views

---

## 📊 Build Verification

Latest successful build (Next.js 16.2.7 Turbopack):

```
Route (app)
┌ ○ /
├ ○ /_not-found
├ ○ /achievements
├ ƒ /api/companion
├ ƒ /api/images
├ ƒ /api/images/[...path]
├ ƒ /api/images/analyze
├ ○ /artworks
├ ƒ /artworks/[id]
├ ○ /artworks/review
├ ○ /dreams
├ ○ /labs
├ ○ /timeline
├ ○ /travel
├ ƒ /travel/[id]
└ ○ /worldbuilding

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

---

## 🗺️ Roadmap (Next Sprint)

| Priority | Feature |
|---|---|
| 🟠 | Local image file upload API (`/api/upload`) |
| 🟠 | Travel plan → father annotation / checklist |
| 🟡 | World knowledge graph visualization (D3.js) |
| 🟢 | Reading notes / study log module |
| 🟢 | IndexedDB migration for larger storage capacity |

---

*Build A Kingdom, Become A Better Human.* 🏰
