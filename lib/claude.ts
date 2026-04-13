import { DECONSTRUCT_PROMPT } from './prompts/deconstruct';
import { CONNECTION_PROMPT } from './prompts/connect';
import { DeconstructedUnit, KnowledgeUnit } from '@/types';

async function callCerebras(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number = 8000
): Promise<string> {
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
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_completion_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Cerebras error:', response.status, err.slice(0, 300));
    throw new Error('Cerebras API error: ' + response.status);
  }

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

function parseJSONArray(text: string): any[] {
  try {
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : parsed.units || parsed.knowledge_units || parsed.connections || [];
  } catch {
    try {
      const m = text.match(/\[[\s\S]*\]/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    console.error('Parse failed:', text.slice(0, 500));
    return [];
  }
}

export async function deconstructContent(
  title: string,
  text: string,
  sourceType: string
): Promise<DeconstructedUnit[]> {
  const prompt = DECONSTRUCT_PROMPT
    .replace('{{TITLE}}', title)
    .replace('{{SOURCE_TYPE}}', sourceType)
    .replace('{{CONTENT}}', text.slice(0, 60000));

  const responseText = await callCerebras(
    'You are an intelligence extraction engine. Respond ONLY with a valid JSON array. No markdown, no explanation.',
    prompt
  );

  return parseJSONArray(responseText);
}

export interface RawConnection {
  source_unit_id: string;
  target_unit_id: string;
  relationship: string;
  note: string;
}

export async function discoverConnections(
  newUnits: KnowledgeUnit[],
  existingUnits: KnowledgeUnit[]
): Promise<RawConnection[]> {
  if (newUnits.length === 0 || existingUnits.length === 0) return [];

  const newFormatted = newUnits.map((u, i) => ({
    id: `new_${i}`,
    type: u.type,
    content: u.content,
    tags: u.tags,
  }));

  const newTags = new Set(newUnits.flatMap(u => u.tags || []));
  
  const scored = existingUnits.map(u => {
    const overlap = (u.tags || []).filter(t => newTags.has(t)).length;
    return { unit: u, overlap };
  });
  scored.sort((a, b) => b.overlap - a.overlap);
  
  const sampled = scored.slice(0, 80).map(s => ({
    id: s.unit.id,
    type: s.unit.type,
    content: s.unit.content,
    tags: s.unit.tags,
  }));

  if (sampled.length === 0) return [];

  const prompt = CONNECTION_PROMPT
    .replace('{{NEW_UNITS}}', JSON.stringify(newFormatted, null, 2))
    .replace('{{EXISTING_UNITS}}', JSON.stringify(sampled, null, 2));

  const responseText = await callCerebras(
    'You are a knowledge connection engine. Respond ONLY with a valid JSON array. No markdown, no explanation. Return [] if no meaningful connections exist.',
    prompt,
    4000
  );

  const raw = parseJSONArray(responseText);

  const validRelationships = ['reinforces', 'contradicts', 'extends', 'contextualizes', 'parallels'];
  const existingIds = new Set(sampled.map(u => u.id));
  
  return raw.filter((c: any) =>
    c.source_unit_id?.startsWith('new_') &&
    existingIds.has(c.target_unit_id) &&
    validRelationships.includes(c.relationship) &&
    c.note
  );
}
