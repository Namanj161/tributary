import { NextRequest, NextResponse } from 'next/server';
import { extractContent } from '@/lib/extractors';
import { deconstructContent, discoverConnections } from '@/lib/claude';
import { supabase } from '@/lib/supabase';
import { scoreRelevance } from '@/lib/relevance';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    const trimmedInput = input.trim();
    const extracted = await extractContent(trimmedInput);

    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        type: extracted.type,
        title: extracted.title,
        url: extracted.url || null,
        author: extracted.author,
        date_published: extracted.date_published,
        full_text: extracted.text,
        intake_mode: 'live',
      })
      .select()
      .single();

    if (sourceError) {
      console.error('Failed to insert source:', sourceError);
      return NextResponse.json({ error: 'Failed to save source' }, { status: 500 });
    }

    const deconstructedUnits = await deconstructContent(
      extracted.title,
      extracted.text,
      extracted.type
    );

    if (deconstructedUnits.length === 0) {
      return NextResponse.json({
        source,
        knowledge_units: [],
        connections: [],
        stats: { total_units: 0, total_sources: 0, units_added: 0, connections_found: 0 },
        warning: 'No knowledge units were extracted.',
      });
    }

    const unitsToInsert = deconstructedUnits.map((unit) => ({
      source_id: source.id,
      type: unit.type,
      content: unit.content,
      context: unit.context,
      tags: unit.tags,
    }));

    const { data: knowledgeUnits, error: unitsError } = await supabase
      .from('knowledge_units')
      .insert(unitsToInsert)
      .select();

    if (unitsError) {
      console.error('Failed to insert knowledge units:', unitsError);
      return NextResponse.json({ error: 'Failed to save knowledge units' }, { status: 500 });
    }

    await supabase
      .from('sources')
      .update({ knowledge_unit_count: knowledgeUnits.length })
      .eq('id', source.id);

    let connectionsFound: any[] = [];
    try {
      const { data: existingUnits } = await supabase
        .from('knowledge_units')
        .select('id, type, content, tags')
        .not('source_id', 'eq', source.id)
        .order('created_at', { ascending: false })
        .limit(200);

      if (existingUnits && existingUnits.length > 0) {
        const rawConnections = await discoverConnections(knowledgeUnits, existingUnits);

        if (rawConnections.length > 0) {
          const connectionsToInsert = rawConnections
            .map((c) => {
              const idx = parseInt(c.source_unit_id.replace('new_', ''));
              if (isNaN(idx) || idx >= knowledgeUnits.length) return null;
              return {
                source_unit_id: knowledgeUnits[idx].id,
                target_unit_id: c.target_unit_id,
                relationship: c.relationship,
                note: c.note,
              };
            })
            .filter(Boolean);

          if (connectionsToInsert.length > 0) {
            const { data: insertedConnections, error: connError } = await supabase
              .from('connections')
              .insert(connectionsToInsert)
              .select('*, source_unit:knowledge_units!connections_source_unit_id_fkey(id, type, content, tags), target_unit:knowledge_units!connections_target_unit_id_fkey(id, type, content, tags)');

            if (!connError) connectionsFound = insertedConnections || [];
            else console.error('Connection insert error:', connError);
          }
        }
      }
    } catch (connErr) {
      console.error('Connection discovery error (non-fatal):', connErr);
    }

    // Step 7: Personal relevance scoring
    let relevance = null;
    try {
      relevance = await scoreRelevance(knowledgeUnits);
    } catch (relErr) {
      console.error('Relevance scoring error (non-fatal):', relErr);
    }

    // Step 8: Persist actions from relevance scoring
    if (relevance?.actions?.length > 0) {
      try {
        const actionsToInsert = relevance.actions.map((a: any) => ({
          source_id: source.id,
          action: a.action,
          urgency: ['now','this_week','when_relevant'].includes(a.urgency) ? a.urgency : 'when_relevant',
          based_on: a.based_on || null,
          status: 'pending',
        }));
        await supabase.from('actions').insert(actionsToInsert);
      } catch (actErr) {
        console.error('Action persist error (non-fatal):', actErr);
      }
    }

    const { count: totalUnits } = await supabase.from('knowledge_units').select('*', { count: 'exact', head: true });
    const { count: totalSources } = await supabase.from('sources').select('*', { count: 'exact', head: true });
    const { count: totalConnections } = await supabase.from('connections').select('*', { count: 'exact', head: true });

    return NextResponse.json({
      source: { ...source, knowledge_unit_count: knowledgeUnits.length },
      knowledge_units: knowledgeUnits,
      connections: connectionsFound,
      stats: {
        total_units: totalUnits || 0,
        total_sources: totalSources || 0,
        units_added: knowledgeUnits.length,
        connections_found: connectionsFound.length,
      relevance,
        total_connections: totalConnections || 0,
      },
    });
  } catch (err: any) {
    console.error('Intake error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
