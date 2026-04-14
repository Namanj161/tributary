import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
  const { data, error } = await supabase
    .from('user_profile')
    .select('*')
    .eq('id', 'default')
    .single();

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  const { data, error } = await supabase
    .from('user_profile')
    .upsert({
      id: 'default',
      role: body.role || '',
      company: body.company || '',
      projects: body.projects || '',
      goals: body.goals || '',
      challenges: body.challenges || '',
      raw_context: body.raw_context || '',
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
  return NextResponse.json(data);
}
