import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const tag = searchParams.get('tag');
  const search = searchParams.get('search');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('knowledge_units')
    .select('*, source:sources(*)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) query = query.eq('type', type);
  if (tag) query = query.contains('tags', [tag]);
  if (search) query = query.ilike('content', `%${search}%`);

  const { data: units, error } = await query;

  if (error) {
    console.error('Knowledge query error:', error);
    return NextResponse.json({ error: 'Failed to query knowledge base' }, { status: 500 });
  }

  const unitIds = (units || []).map(u => u.id);
  let connectionMap: Record<string, any[]> = {};

  if (unitIds.length > 0) {
    const { data: outgoing } = await supabase
      .from('connections')
      .select('*, target_unit:knowledge_units!connections_target_unit_id_fkey(id, type, content, tags)')
      .in('source_unit_id', unitIds);

    const { data: incoming } = await supabase
      .from('connections')
      .select('*, source_unit:knowledge_units!connections_source_unit_id_fkey(id, type, content, tags)')
      .in('target_unit_id', unitIds);

    for (const conn of outgoing || []) {
      if (!connectionMap[conn.source_unit_id]) connectionMap[conn.source_unit_id] = [];
      connectionMap[conn.source_unit_id].push({ ...conn, direction: 'outgoing', connected_unit: conn.target_unit });
    }
    for (const conn of incoming || []) {
      if (!connectionMap[conn.target_unit_id]) connectionMap[conn.target_unit_id] = [];
      connectionMap[conn.target_unit_id].push({ ...conn, direction: 'incoming', connected_unit: conn.source_unit });
    }
  }

  const unitsWithConnections = (units || []).map(u => ({ ...u, connections: connectionMap[u.id] || [] }));

  const { count: totalUnits } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true });
  const { count: totalSources } = await supabase.from('sources').select('*', { count: 'exact', head: true });
  const { count: totalConnections } = await supabase.from('connections').select('*', { count: 'exact', head: true });

  const { data: allUnits } = await supabase.from('knowledge_units').select('tags');
  const allTags = new Set<string>();
  allUnits?.forEach((u) => u.tags?.forEach((t: string) => allTags.add(t)));

  return NextResponse.json({
    units: unitsWithConnections,
    stats: { total_units: totalUnits || 0, total_sources: totalSources || 0, total_connections: totalConnections || 0 },
    available_tags: Array.from(allTags).sort(),
  });
}
