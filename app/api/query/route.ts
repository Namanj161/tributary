import { NextRequest, NextResponse } from 'next/server';
import { QUERY_PROMPT } from '@/lib/prompts/query';
import { supabase } from '@/lib/supabase';

export const maxDuration = 30;

export async function POST(request: NextRequest) {
  try {
    const { question } = await request.json();

    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: 'Question is required' }, { status: 400 });
    }

    const q = question.trim();

    // Extract keywords from question for search
    const stopWords = new Set(['what','how','why','when','where','who','is','are','was','were','do','does','did','the','a','an','in','on','at','to','for','of','and','or','but','not','with','about','from','this','that','my','your','can','could','would','should','will','has','have','had']);
    const keywords = q.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

    // Fetch units using multiple strategies
    let allUnits: any[] = [];

    // Strategy 1: Content text search (ilike for each keyword)
    for (const kw of keywords.slice(0, 5)) {
      const { data } = await supabase
        .from('knowledge_units')
        .select('id, type, content, context, tags, source:sources(title, type)')
        .ilike('content', `%${kw}%`)
        .limit(15);
      if (data) allUnits.push(...data);
    }

    // Strategy 2: Tag matching
    for (const kw of keywords.slice(0, 5)) {
      const { data } = await supabase
        .from('knowledge_units')
        .select('id, type, content, context, tags, source:sources(title, type)')
        .contains('tags', [kw])
        .limit(10);
      if (data) allUnits.push(...data);

      // Also try with hyphens (tags often use hyphens)
      const hyphenated = keywords.slice(0, 3).map(k => k).join('-');
      if (hyphenated.length > 3) {
        const { data: tagData } = await supabase
          .from('knowledge_units')
          .select('id, type, content, context, tags, source:sources(title, type)')
          .contains('tags', [hyphenated])
          .limit(5);
        if (tagData) allUnits.push(...tagData);
      }
    }

    // Strategy 3: If few results, also fetch recent units (they might be contextually relevant)
    if (allUnits.length < 10) {
      const { data } = await supabase
        .from('knowledge_units')
        .select('id, type, content, context, tags, source:sources(title, type)')
        .order('created_at', { ascending: false })
        .limit(20);
      if (data) allUnits.push(...data);
    }

    // Deduplicate by ID
    const seen = new Set<string>();
    const uniqueUnits = allUnits.filter(u => {
      if (seen.has(u.id)) return false;
      seen.add(u.id);
      return true;
    });

    // Score units by relevance (keyword overlap)
    const scored = uniqueUnits.map(u => {
      const text = (u.content + ' ' + (u.tags || []).join(' ')).toLowerCase();
      const score = keywords.reduce((s, kw) => s + (text.includes(kw) ? 1 : 0), 0);
      return { unit: u, score };
    });
    scored.sort((a, b) => b.score - a.score);

    // Take top 25 most relevant
    const relevant = scored.slice(0, 25).map(s => s.unit);

    if (relevant.length === 0) {
      return NextResponse.json({
        answer: "Your knowledge base doesn't have content related to this question yet. Try feeding in some articles, videos, or text about this topic first.",
        confidence: 'low',
        units_cited: [],
        cited_units: [],
        follow_up_questions: [],
        gaps: 'No relevant knowledge units found.',
      });
    }

    // Format units for the prompt
    const formattedUnits = relevant.map((u, i) => 
      `[${i + 1}] (${u.type}) ${u.content}\n    Tags: ${(u.tags || []).join(', ')}\n    Source: ${(u as any).source?.title || 'Unknown'}`
    ).join('\n\n');

    // Build prompt
    const prompt = QUERY_PROMPT
      .replace('{{QUESTION}}', q)
      .replace('{{UNITS}}', formattedUnits);

    // Call Cerebras
    const apiKey = process.env.CEREBRAS_API_KEY;
    if (!apiKey) throw new Error('CEREBRAS_API_KEY not set');

    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: [
          { role: 'system', content: 'You are a knowledge synthesis engine. Respond ONLY with valid JSON. No markdown, no explanation.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Cerebras error:', response.status, err.slice(0, 300));
      throw new Error('Query synthesis failed');
    }

    const data = await response.json();
    const responseText = data?.choices?.[0]?.message?.content || '';

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      const m = responseText.match(/\{[\s\S]*\}/);
      if (m) result = JSON.parse(m[0]);
      else result = { answer: responseText, confidence: 'medium', units_cited: [], follow_up_questions: [], gaps: null };
    }

    // Attach the actual cited units for display
    const citedIndices = result.units_cited || [];
    const citedUnits = citedIndices
      .filter((i: number) => i >= 0 && i < relevant.length)
      .map((i: number) => ({
        index: i + 1,
        ...relevant[i],
      }));

    return NextResponse.json({
      ...result,
      cited_units: citedUnits,
      total_units_searched: uniqueUnits.length,
      units_used: relevant.length,
    });
  } catch (err: any) {
    console.error('Query error:', err);
    return NextResponse.json({ error: err.message || 'Query failed' }, { status: 500 });
  }
}
