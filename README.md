# TPIC — Tributary Personal Intelligence Compiler

A personal knowledge management system that extracts atomic knowledge units from any content you consume, discovers connections between ideas, compiles an evolving wiki, and lets you query your entire knowledge base.

Built with Next.js, Supabase, and Cerebras LLM (llama3.1-8b).

GitHub: https://github.com/Namanj161/tributary

## What It Does

Feed TPIC any content — YouTube videos, tweets, articles, PDFs, Word docs, Notion pages, or raw text. It extracts, deconstructs into atomic knowledge units, discovers connections to existing knowledge, compiles a wiki, and answers questions with citations.

## Tech Stack

Next.js 16.2.3, Supabase (PostgreSQL), Cerebras API (llama3.1-8b), react-force-graph-2d, cheerio, youtube-transcript, pdf-parse, mammoth

## Pages

- Intake (/) — URL, text, bulk import, file upload
- Knowledge Base (/knowledge) — browse units with search/filter
- Graph (/graph) — force-directed knowledge graph
- Query (/query) — ask questions, get cited answers
- Wiki (/wiki) — auto-compiled articles from unit clusters
- Profile (/profile) — personal context for relevance scoring
- Actions (/actions) — action items from relevance scoring
- Capture (/setup) — browser bookmarklet setup

## Setup

1. Clone: git clone https://github.com/Namanj161/tributary.git && cd tributary && npm install
2. Create .env.local with NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, CEREBRAS_API_KEY
3. Run database schema in Supabase SQL Editor (see supabase-schema.sql + wiki/actions/profile tables)
4. npm run dev → http://localhost:3000

## Pipeline

Content → Extract Text → LLM Deconstruction → Store Units → Discover Connections → Auto-Compile Wiki

## Version History

v0: Base extraction | v1.0: Connections + bulk | v1.1: All extractors + graph | v1.2: Query | v1.3: Profile + relevance | v1.4: Actions | v1.5: Bookmarklet | v1.6: Wiki compilation | v1.7: Wiki-graph integration + auto-compile
