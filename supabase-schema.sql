-- Tributary Database Schema
-- Run this in Supabase SQL Editor

-- Sources: each piece of content you feed in
CREATE TABLE sources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('youtube', 'twitter_thread', 'blog_post', 'article', 'raw_text', 'notion_page')),
  title TEXT NOT NULL,
  url TEXT,
  author TEXT,
  date_published TIMESTAMPTZ,
  date_consumed TIMESTAMPTZ DEFAULT NOW(),
  full_text TEXT NOT NULL,
  intake_mode TEXT NOT NULL DEFAULT 'live' CHECK (intake_mode IN ('live', 'bulk')),
  knowledge_unit_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Knowledge Units: atomic pieces of knowledge extracted from sources
CREATE TABLE knowledge_units (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('framework', 'tactic', 'claim', 'insight', 'story', 'number', 'question', 'principle', 'example', 'warning')),
  content TEXT NOT NULL,
  context TEXT,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Connections: relationships between knowledge units
CREATE TABLE connections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  source_unit_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
  target_unit_id UUID NOT NULL REFERENCES knowledge_units(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL CHECK (relationship IN ('reinforces', 'contradicts', 'extends', 'contextualizes', 'parallels')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(source_unit_id, target_unit_id)
);

-- Indexes for performance
CREATE INDEX idx_knowledge_units_source ON knowledge_units(source_id);
CREATE INDEX idx_knowledge_units_type ON knowledge_units(type);
CREATE INDEX idx_knowledge_units_tags ON knowledge_units USING GIN(tags);
CREATE INDEX idx_connections_source ON connections(source_unit_id);
CREATE INDEX idx_connections_target ON connections(target_unit_id);
CREATE INDEX idx_sources_type ON sources(type);
CREATE INDEX idx_sources_date_consumed ON sources(date_consumed DESC);

-- Enable Row Level Security (required by Supabase, but we'll keep it open for now)
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

-- Allow all operations for now (single user system)
CREATE POLICY "Allow all on sources" ON sources FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on knowledge_units" ON knowledge_units FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on connections" ON connections FOR ALL USING (true) WITH CHECK (true);
