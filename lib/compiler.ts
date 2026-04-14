import { COMPILE_PROMPT } from './prompts/compile';
import { supabase } from './supabase';

interface TopicCluster {
  topic: string;
  unitIds: string[];
  unitContents: { id: string; type: string; content: string; tags: string[]; sourceTitle: string }[];
}

export async function identifyTopics(unitIds?: string[]): Promise<TopicCluster[]> {
  // Fetch units
  let query = supabase
    .from('knowledge_units')
    .select('id, type, content, tags, source:sources(title)')
    .order('created_at', { ascending: false });

  if (unitIds && unitIds.length > 0) {
    query = query.in('id', unitIds);
  }

  const { data: units } = await query.limit(300);
  if (!units || units.length === 0) return [];

  // Group by tags — find clusters of 3+ units sharing a tag
  const tagMap = new Map<string, typeof units>();

  for (const unit of units) {
    for (const tag of (unit.tags || [])) {
      if (!tagMap.has(tag)) tagMap.set(tag, []);
      tagMap.get(tag)!.push(unit);
    }
  }

  // Filter to tags with 3+ units — these are worth compiling
  const clusters: TopicCluster[] = [];
  const seen = new Set<string>();

  for (const [tag, tagUnits] of tagMap) {
    if (tagUnits.length < 3) continue;
    if (seen.has(tag)) continue;

    // Merge similar tags (e.g., "ai-safety" and "ai-risk")
    const baseTopic = tag.replace(/-/g, ' ');
    seen.add(tag);

    clusters.push({
      topic: baseTopic,
      unitIds: tagUnits.map(u => u.id),
      unitContents: tagUnits.map(u => ({
        id: u.id,
        type: u.type,
        content: u.content,
        tags: u.tags,
        sourceTitle: (u as any).source?.title || 'Unknown',
      })),
    });
  }

  // Sort by unit count descending — richest topics first
  clusters.sort((a, b) => b.unitIds.length - a.unitIds.length);

  return clusters.slice(0, 20); // Top 20 topics max
}

export async function compileArticle(cluster: TopicCluster): Promise<string> {
  const apiKey = process.env.CEREBRAS_API_KEY;
  if (!apiKey) throw new Error('CEREBRAS_API_KEY not set');

  // Check for existing article
  const { data: existing } = await supabase
    .from('wiki_articles')
    .select('content')
    .eq('topic', cluster.topic)
    .single();

  const formattedUnits = cluster.unitContents.map((u, i) =>
    `[${i + 1}] (${u.type}) ${u.content}\n    Source: ${u.sourceTitle}\n    Tags: ${u.tags.join(', ')}`
  ).join('\n\n');

  const prompt = COMPILE_PROMPT
    .replace('{{TOPIC}}', cluster.topic)
    .replace('{{UNITS}}', formattedUnits)
    .replace('{{EXISTING}}', existing?.content || 'None — this is a new article.');

  const response = await fetch('https://api.cerebras.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama3.1-8b',
      messages: [
        { role: 'system', content: 'You are a knowledge compiler. Write clear, well-structured markdown articles. No JSON. Just the article.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
      max_completion_tokens: 4000,
    }),
  });

  if (!response.ok) throw new Error('Compilation failed');

  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

export async function compileWiki(): Promise<{ compiled: number; topics: string[] }> {
  const clusters = await identifyTopics();
  const compiled: string[] = [];

  for (const cluster of clusters) {
    try {
      const article = await compileArticle(cluster);
      if (!article || article.length < 50) continue;

      // Count unique sources
      const sourceSet = new Set(cluster.unitContents.map(u => u.sourceTitle));

      await supabase.from('wiki_articles').upsert({
        topic: cluster.topic,
        content: article,
        unit_ids: cluster.unitIds,
        source_count: sourceSet.size,
        unit_count: cluster.unitIds.length,
        last_compiled: new Date().toISOString(),
      }, { onConflict: 'topic' });

      compiled.push(cluster.topic);
    } catch (err) {
      console.error(`Failed to compile ${cluster.topic}:`, err);
    }
  }

  return { compiled: compiled.length, topics: compiled };
}
