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

  if (type) {
    query = query.eq('type', type);
  }

  if (tag) {
    query = query.contains('tags', [tag]);
  }

  if (search) {
    query = query.ilike('content', `%${search}%`);
  }

  const { data: units, error } = await query;

  if (error) {
    console.error('Knowledge query error:', error);
    return NextResponse.json({ error: 'Failed to query knowledge base' }, { status: 500 });
  }

  // Get aggregate stats
  const { count: totalUnits } = await supabase
    .from('knowledge_units')
    .select('*', { count: 'exact', head: true });

  const { count: totalSources } = await supabase
    .from('sources')
    .select('*', { count: 'exact', head: true });

  // Get all unique tags for filtering
  const { data: allUnits } = await supabase
    .from('knowledge_units')
    .select('tags');

  const allTags = new Set<string>();
  allUnits?.forEach((u) => u.tags?.forEach((t: string) => allTags.add(t)));

  return NextResponse.json({
    units,
    stats: {
      total_units: totalUnits || 0,
      total_sources: totalSources || 0,
    },
    available_tags: Array.from(allTags).sort(),
  });
}
