import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('actions')
    .select('*, source:sources(title, type)')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: 'Failed to fetch actions' }, { status: 500 });

  const pending = (data || []).filter(a => a.status === 'pending').length;
  const done = (data || []).filter(a => a.status === 'done').length;

  return NextResponse.json({ actions: data || [], stats: { pending, done, total: (data || []).length } });
}

export async function PATCH(request: NextRequest) {
  const { id, status } = await request.json();
  
  const update: any = { status };
  if (status === 'done') update.completed_at = new Date().toISOString();

  const { error } = await supabase.from('actions').update(update).eq('id', id);
  if (error) return NextResponse.json({ error: 'Failed to update action' }, { status: 500 });

  return NextResponse.json({ ok: true });
}
