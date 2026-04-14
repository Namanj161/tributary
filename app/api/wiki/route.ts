import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { compileWiki } from '@/lib/compiler';

export const maxDuration = 120;

export async function GET() {
  const { data: articles, error } = await supabase
    .from('wiki_articles')
    .select('id, topic, unit_count, source_count, last_compiled, created_at')
    .order('unit_count', { ascending: false });

  if (error) return NextResponse.json({ error: 'Failed to fetch wiki' }, { status: 500 });

  return NextResponse.json({ articles: articles || [] });
}

export async function POST(request: NextRequest) {
  try {
    const result = await compileWiki();
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Wiki compilation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
