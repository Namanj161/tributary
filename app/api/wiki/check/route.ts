import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  const topic = request.nextUrl.searchParams.get('topic');
  if (!topic) return NextResponse.json({ exists: false });

  const { data } = await supabase
    .from('wiki_articles')
    .select('id')
    .eq('topic', topic)
    .maybeSingle();

  return NextResponse.json({ exists: !!data });
}
