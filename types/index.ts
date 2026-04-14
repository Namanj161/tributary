export type SourceType = 'youtube' | 'twitter_thread' | 'blog_post' | 'article' | 'raw_text' | 'notion_page' | 'pdf';

export type KnowledgeUnitType =
  | 'framework' | 'tactic' | 'claim' | 'insight' | 'story'
  | 'number' | 'question' | 'principle' | 'example' | 'warning';

export type ConnectionType = 'reinforces' | 'contradicts' | 'extends' | 'contextualizes' | 'parallels';

export type IntakeMode = 'live' | 'bulk';

export interface Source {
  id: string;
  type: SourceType;
  title: string;
  url: string | null;
  author: string | null;
  date_published: string | null;
  date_consumed: string;
  full_text: string;
  intake_mode: IntakeMode;
  knowledge_unit_count: number;
  created_at: string;
}

export interface KnowledgeUnit {
  id: string;
  source_id: string;
  type: KnowledgeUnitType;
  content: string;
  context: string | null;
  tags: string[];
  created_at: string;
  source?: Source;
  connections?: Connection[];
}

export interface Connection {
  id: string;
  source_unit_id: string;
  target_unit_id: string;
  relationship: ConnectionType;
  note: string | null;
  created_at: string;
  target_unit?: KnowledgeUnit;
  source_unit?: KnowledgeUnit;
}

export interface IntakeBrief {
  source: Source;
  knowledge_units: KnowledgeUnit[];
  connections: Connection[];
  stats: {
    total_units: number;
    total_sources: number;
    units_added: number;
    connections_found: number;
    total_connections?: number;
  };
}

export interface BulkResult {
  input: string;
  status: 'success' | 'error';
  title?: string;
  units_added?: number;
  error?: string;
}

export interface BulkBrief {
  results: BulkResult[];
  connections_found: number;
  stats: {
    total_units: number;
    total_sources: number;
    total_connections: number;
    sources_processed: number;
    sources_failed: number;
    units_added: number;
  };
}

export interface ExtractionResult {
  type: SourceType;
  title: string;
  author: string | null;
  text: string;
  url: string;
  date_published: string | null;
}

export interface DeconstructedUnit {
  type: KnowledgeUnitType;
  content: string;
  context: string;
  tags: string[];
}
