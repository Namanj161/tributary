# TPIC Build Journey — April 14, 2026

**Started:** 7:00 AM IST
**Finished:** 2:20 PM IST (~7 hours)
**Live at:** tributary-six.vercel.app
**Repo:** github.com/Namanj161/tributary

## The Idea

A personal knowledge compiler — point it at anything you consume on the internet, extract everything useful, connect it to everything you already know, and compound it into an evolving intelligence layer. Not a note-taking app. Not a bookmarking tool. A system where knowledge accumulates and synthesizes automatically.

## What Got Built

**v0 (Hour 1)** — Base extraction pipeline. Next.js + Supabase + Cerebras. YouTube transcript extraction, article parsing via cheerio, raw text input. LLM deconstructs content into 10 types of atomic knowledge units (frameworks, tactics, claims, insights, stories, numbers, questions, principles, examples, warnings). Intake page with real-time brief showing extraction results.

**v1.0 (Hour 2)** — Connection discovery. After extracting units, the LLM scans the existing KB (prioritized by tag overlap, max 80 units), finds relationships: reinforces, contradicts, extends, contextualizes, parallels. Bulk import for up to 10 URLs at once. Knowledge base page with search, type filters, tag filters, and expandable connection details.

**v1.1 (Hours 3-4)** — Extractors + Graph. Added Twitter/X (FxTwitter API, no auth), Notion pages (API), PDF (pdf-parse), DOCX (mammoth), text files. 3-mode intake: URL/Text, Bulk Import, Upload File with drag-and-drop. Force-directed knowledge graph with react-force-graph-2d — fought DPR/canvas rendering issues across 5 versions before landing on the library approach. Graph supports color by source/type, detail panel, connection navigation.

**v1.2 (Hour 4)** — Query mode. Multi-strategy search (keyword, tag matching, recency fallback), relevance scoring by keyword overlap, top 25 units sent to LLM for synthesis. Returns cited answers with confidence levels, follow-up questions, and knowledge gap detection.

**v1.3 (Hour 5)** — Personal context engine. User profile (role, company, projects, goals, challenges). After extraction, scores each unit's relevance to the user's specific situation. Generates personalized actions with urgency levels.

**v1.4 (Hour 5)** — Actions dashboard. Persists actions from relevance scoring. Filter by pending/done/skipped, checkbox to complete, skip button.

**v1.5 (Hour 5)** — Browser bookmarklet. Two modes: Quick Capture (background processing with toast notification, never leaves the page) and Open in TPIC (new tab with URL pre-filled). CORS-enabled capture API endpoint.

**v1.6 (Hour 6)** — Wiki compilation (Karpathy-inspired). After researching Karpathy's LLM Knowledge Base system (18.7M views, 5000+ GitHub stars), identified the key insight: compilation over retrieval. TPIC clusters units by shared tags (3+ units = compilable topic), LLM synthesizes full wiki articles with cross-references, [[topic]] links, and open questions. Compiled 16 articles from 57 units on first run. Wiki-graph integration: mini knowledge graph below each article, clickable [[links]] between articles, "View in Wiki" from graph detail panel.

**v1.7 (Hour 7)** — Auto wiki compilation wired into intake (fire and forget). Frontend polish pass via Claude Code: shared Nav component across all 8 pages, error boundaries, loading states, consistent styling, version badge. Vercel deployment fixed (TS build errors bypassed). Final commit and push.

## Architecture

### Tech Stack
- **Frontend**: Next.js 16.2.3 (React 19, App Router, inline styles)
- **Database**: Supabase (PostgreSQL)
- **LLM**: Cerebras API (llama3.1-8b)
- **Graph**: react-force-graph-2d
- **Extractors**: youtube-transcript, cheerio, pdf-parse, mammoth, FxTwitter API

### Database Tables
- `sources` — each piece of content fed in
- `knowledge_units` — atomic knowledge extracted from sources (10 types)
- `connections` — relationships between units (5 types)
- `wiki_articles` — auto-compiled articles from unit clusters
- `user_profile` — personal context for relevance scoring
- `actions` — action items generated from relevance scoring

### PipelinContent In → Extract Text → LLM Deconstruction → Store Units → Discover Connections → Auto-Compile Wiki
e### Pages
| Page | Route | Description |
|------|-------|-------------|
| Intake | `/` | Feed content via URL, raw text, bulk import, or file upload |
| Knowledge Base | `/knowledge` | Browse all units with search, type/tag filters, connection counts |
| Graph | `/graph` | Force-directed knowledge graph, color by source/type |
| Query | `/query` | Ask questions, get synthesized answers with citations |
| Wiki | `/wiki` | Auto-compiled articles with mini-graphs and [[interlinks]] |
| Profile | `/profile` | Personal context for relevance scoring |
| Actions | `/actions` | Action items from relevance scoring |
| Capture | `/setup` | Browser bookmarklet for one-click capture |

### Supported Sources
YouTube, Twitter/X, articles/blogs, Notion pages, PDF, DOCX, TXT/MD/CSV/JSON, raw text

## Architecture Decisions

- **Cerebras over Claude API** for extraction — faster, cheaper for high-volume LLM calls on llama3.1-8b
- **Supabase over local SQLite** — accessible from anywhere, real PostgreSQL with GIN indexes for tag search
- **react-force-graph-2d over raw canvas** — after 5 failed canvas attempts fighting DPR issues
- **Wiki compilation inspired by Karpathy** but integrated into existing TPIC pipeline, not a separate system
- **Inline styles over Tailwind/CSS modules** — faster iteration, no build tooling issues
- **Auto-compile wiki after intake** — knowledge compounds without manual intervention

## Tools Used During Build

- **Claude (chat)** — all feature design, architecture decisions, code generation, debugging
- **Claude Code** — multi-file edits (nav component, wiki-graph integration, frontend polish)
- **Terminal** — file creation, git, npm
- **Supabase SQL Editor** — database schema, migrations
- **Vercel** — deployment, auto-deploy from git

## Environment Variables Required## Setup Instructions

1. Clone: `git clone https://github.com/Namanj161/tributary.git && cd tributary && npm install`
2. Create `.env.local` with the environment variables above
3. Run the database schema in Supabase SQL Editor (all CREATE TABLE statements are in the README)
4. `npm run dev` → http://localhost:3000
5. Deploy: connect repo to Vercel, add env vars, every git push auto-deploys

## Future Directions

- Semantic/embedding-based search (upgrade from keyword matching)
- Tag merging (e.g., "ai-safety" and "safety" should merge)
- Knowledge gaps detection (based on goals vs KB coverage)
- Cosmograph GPU-accelerated graph (attempted, hit CSS module compatibility issue with Next.js Turbopack)
- Mobile responsive design
- Chrome extension (upgrade from bookmarklet)
- Multi-user support

## Current State (End of Build)

57 knowledge units, 25 connections, 16 wiki articles, 4 sources. The system works end-to-end. The more content flows through it, the smarter the wiki gets and the more useful queries become.
