import { DECONSTRUCT_PROMPT } from './prompts/deconstruct';
import { DeconstructedUnit } from '@/types';

export async function deconstructContent(
  title: string,
  text: string,
  sourceType: string
): Promise<DeconstructedUnit[]> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) throw new Error('CEREBRAS_API_KEY not set');

  const prompt = DECONSTRUCT_PROMPT
    .replace('{{TITLE}}', title)
    .replace('{{SOURCE_TYPE}}', sourceType)
    .replace('{{CONTENT}}', text.slice(0, 60000));

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama3.1-8b',
      messages: [
        { role: 'system', content: 'You are an intelligence extraction engine. Respond ONLY with a valid JSON array. No markdown, no explanation.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_completion_tokens: 8000,
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    console.error('Cerebras error:', response.status, err.slice(0, 300));
    throw new Error('Cerebras API error: ' + response.status);
  }

  const data = await response.json();
  const responseText = data?.choices?.[0]?.message?.content || '';

  try {
    const parsed = JSON.parse(responseText);
    return Array.isArray(parsed) ? parsed : parsed.units || parsed.knowledge_units || [];
  } catch {
    try {
      const m = responseText.match(/\[[\s\S]*\]/);
      if (m) return JSON.parse(m[0]);
    } catch {}
    console.error('Parse failed:', responseText.slice(0, 500));
    return [];
  }
}
