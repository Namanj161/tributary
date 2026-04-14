import { RELEVANCE_PROMPT } from './prompts/relevance';
import { KnowledgeUnit } from '@/types';
import { supabase } from './supabase';

export interface RelevanceResult {
  relevant_units: {
    unit_index: number;
    relevance_score: number;
    why_relevant: string;
    how_to_apply: string;
    connects_to: string;
  }[];
  actions: {
    action: string;
    urgency: string;
    based_on: string;
  }[];
  overall_relevance: string;
  summary: string;
}

export async function scoreRelevance(units: KnowledgeUnit[]): Promise<RelevanceResult | null> {
  // Fetch user profile
  const { data: profile } = await supabase
    .from('user_profile')
    .select('*')
    .eq('id', 'default')
    .single();

  if (!profile) return null;

  // Check if profile has meaningful content
  const hasContext = [profile.role, profile.company, profile.projects, profile.goals, profile.challenges, profile.raw_context]
    .some(v => v && v.trim().length > 10);

  if (!hasContext) return null;

  const formattedUnits = units.map((u, i) =>
    `[${i}] (${u.type}) ${u.content}\n    Tags: ${(u.tags || []).join(', ')}`
  ).join('\n\n');

  const prompt = RELEVANCE_PROMPT
    .replace('{{ROLE}}', profile.role || 'Not specified')
    .replace('{{COMPANY}}', profile.company || 'Not specified')
    .replace('{{PROJECTS}}', profile.projects || 'Not specified')
    .replace('{{GOALS}}', profile.goals || 'Not specified')
    .replace('{{CHALLENGES}}', profile.challenges || 'Not specified')
    .replace('{{RAW_CONTEXT}}', profile.raw_context || 'None')
    .replace('{{UNITS}}', formattedUnits);

  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3.1-8b',
        messages: [
          { role: 'system', content: 'You are a personal knowledge advisor. Respond ONLY with valid JSON. No markdown.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_completion_tokens: 4000,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content || '';

    try {
      return JSON.parse(text);
    } catch {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) return JSON.parse(m[0]);
      return null;
    }
  } catch {
    return null;
  }
}
