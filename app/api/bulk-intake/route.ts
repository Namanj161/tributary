import { NextRequest, NextResponse } from 'next/server';
import { extractContent } from '@/lib/extractors';
import { deconstructContent, discoverConnections } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

export const maxDuration = 300;

interface BulkResult {
  input: string;
  status: 'success' | 'error';
  title?: string;
  units_added?: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { inputs } = await request.json();

    if (!Array.isArray(inputs) || inputs.length === 0) {
      return NextResponse.json({ error: 'inputs array is required' }, { status: 400 });
    }
    if (inputs.length > 10) {
      return NextResponse.json({ error: 'Maximum 10 items per bulk import' }, { status: 400 });
    }

    const results: BulkResult[] = [];
    const allNewUnitIds: string[] = [];

    for (const input of inputs) {
      if (!input || typeof input !== 'string' || input.trim().length === 0) {
        results.push({ input: input || '', status: 'error', error: 'Empty input' });
        continue;
      }

      try {
        const extracted = await extractContent(input.trim());

        const { data: source, error: sourceError } = await supabase
          .from('sources')
          .insert({
            type: extracted.type,
            title: extracted.title,
            url: extracted.url || null,
            author: extracted.author,
            date_published: extracted.date_published,
            full_text: extracted.text,
            intake_mode: 'bulk',
          })
          .select()
          .single();

        if (sourceError) throw new Error('Failed to save source');

        const deconstructedUnits = await deconstructContent(extracted.title, extracted.text, extracted.type);

        if (deconstructedUnits.length === 0) {
          results.push({ input: input.trim().slice(0, 80), status: 'success', title: extracted.title, units_added: 0 });
          continue;
        }

        const unitsToInsert = deconstructedUnits.map((unit) => ({
          source_id: source.id, type: unit.type, content: unit.content, context: unit.context, tags: unit.tags,
        }));

        const { data: knowledgeUnits, error: unitsError } = await supabase.from('knowledge_units').insert(unitsToInsert).select();
        if (unitsError) throw new Error('Failed to save knowledge units');

        await supabase.from('sources').update({ knowledge_unit_count: knowledgeUnits.length }).eq('id', source.id);
        allNewUnitIds.push(...knowledgeUnits.map((u) => u.id));

        results.push({ input: input.trim().slice(0, 80), status: 'success', title: extracted.title, units_added: knowledgeUnits.length });
      } catch (err: any) {
        results.push({ input: input.trim().slice(0, 80), status: 'error', error: err.message || 'Processing failed' });
      }
    }

    let connectionsFound = 0;
    try {
      if (allNewUnitIds.length > 0) {
        const { data: newUnits } = await supabase.from('knowledge_units').select('id, type, content, tags').in('id', allNewUnitIds);

        const { data: existingUnits } = await supabase
          .from('knowledge_units')
          .select('id, type, content, tags')
          .not('id', 'in', `(${allNewUnitIds.join(',')})`)
          .order('created_at', { ascending: false })
          .limit(200);

        if (newUnits && existingUnits && existingUnits.length > 0) {
          const rawConnections = await discoverConnections(newUnits, existingUnits);
          if (rawConnections.length > 0) {
            const connectionsToInsert = rawConnections
              .map((c) => {
                const idx = parseInt(c.source_unit_id.replace('new_', ''));
                if (isNaN(idx) || idx >= newUnits.length) return null;
                return { source_unit_id: newUnits[idx].id, target_unit_id: c.target_unit_id, relationship: c.relationship, note: c.note };
              })
              .filter(Boolean);

            if (connectionsToInsert.length > 0) {
              const { data: inserted, error: connErr } = await supabase.from('connections').insert(connectionsToInsert).select();
              if (!connErr && inserted) connectionsFound = inserted.length;
            }
          }
        }
      }
    } catch (connErr) {
      console.error('Bulk connection discovery error (non-fatal):', connErr);
    }

    const { count: totalUnits } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true });
    const { count: totalSources } = await supabase.from('sources').select('*', { count: 'exact', head: true });
    const { count: totalConnections } = await supabase.from('connections').select('*', { count: 'exact', head: true });

    const successCount = results.filter((r) => r.status === 'success').length;
    const totalAdded = results.reduce((sum, r) => sum + (r.units_added || 0), 0);

    return NextResponse.json({
      results,
      connections_found: connectionsFound,
      stats: {
        total_units: totalUnits || 0,
        total_sources: totalSources || 0,
        total_connections: totalConnections || 0,
        sources_processed: successCount,
        sources_failed: results.length - successCount,
        units_added: totalAdded,
      },
    });
  } catch (err: any) {
    console.error('Bulk intake error:', err);
    return NextResponse.json({ error: err.message || 'Bulk intake failed' }, { status: 500 });
  }
}
