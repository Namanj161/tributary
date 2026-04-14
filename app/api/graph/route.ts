import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  // Fetch all units with source info
  const { data: units, error: unitsError } = await supabase
    .from('knowledge_units')
    .select('id, type, content, tags, source_id, source:sources(id, title, type)')
    .order('created_at', { ascending: false })
    .limit(300);

  if (unitsError) {
    return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
  }

  // Fetch all connections
  const { data: connections, error: connError } = await supabase
    .from('connections')
    .select('id, source_unit_id, target_unit_id, relationship, note');

  if (connError) {
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }

  // Build source clusters
  const sources = new Map<string, { id: string; title: string; type: string; unitCount: number }>();
  for (const unit of units || []) {
    const src = (unit as any).source;
    if (src && !sources.has(src.id)) {
      sources.set(src.id, { id: src.id, title: src.title, type: src.type, unitCount: 0 });
    }
    if (src) {
      const s = sources.get(src.id)!;
      s.unitCount++;
    }
  }

  return NextResponse.json({
    nodes: (units || []).map((u: any) => ({
      id: u.id,
      type: u.type,
      content: u.content.slice(0, 120),
      fullContent: u.content,
      tags: u.tags,
      sourceId: u.source_id,
      sourceTitle: u.source?.title || 'Unknown',
      sourceType: u.source?.type || 'raw_text',
    })),
    edges: (connections || []).map((c: any) => ({
      id: c.id,
      source: c.source_unit_id,
      target: c.target_unit_id,
      relationship: c.relationship,
      note: c.note,
    })),
    sources: Array.from(sources.values()),
  });
}
