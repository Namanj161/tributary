import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const topic = request.nextUrl.searchParams.get('topic');
  if (!topic) return NextResponse.json({ error: 'Topic required' }, { status: 400 });

  const { data, error } = await supabase
    .from('wiki_articles')
    .select('*')
    .eq('topic', topic)
    .single();

  if (error || !data) return NextResponse.json({ error: 'Article not found' }, { status: 404 });

  return NextResponse.json(data);
}
