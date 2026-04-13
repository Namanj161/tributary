import { NextRequest, NextResponse } from 'next/server';
import { extractContent } from '@/lib/extractors';
import { deconstructContent } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

export const maxDuration = 60; // Allow up to 60s for long transcripts

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json();

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return NextResponse.json({ error: 'Input is required' }, { status: 400 });
    }

    const trimmedInput = input.trim();

    // Step 1: Extract content from the source
    const extracted = await extractContent(trimmedInput);

    // Step 2: Store the source record
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

    // Step 3: Deconstruct content into knowledge units via Claude
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
        stats: {
          total_units: 0,
          total_sources: 0,
          units_added: 0,
          connections_found: 0,
        },
        warning: 'No knowledge units were extracted. The content may be too short or unstructured.',
      });
    }

    // Step 4: Store knowledge units
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

    // Step 5: Update source with unit count
    await supabase
      .from('sources')
      .update({ knowledge_unit_count: knowledgeUnits.length })
      .eq('id', source.id);

    // Step 6: Get total stats
    const { count: totalUnits } = await supabase
      .from('knowledge_units')
      .select('*', { count: 'exact', head: true });

    const { count: totalSources } = await supabase
      .from('sources')
      .select('*', { count: 'exact', head: true });

    // Return the intake brief
    return NextResponse.json({
      source: { ...source, knowledge_unit_count: knowledgeUnits.length },
      knowledge_units: knowledgeUnits,
      connections: [], // Phase 1: connection discovery
      stats: {
        total_units: totalUnits || 0,
        total_sources: totalSources || 0,
        units_added: knowledgeUnits.length,
        connections_found: 0,
      },
    });
  } catch (err: any) {
    console.error('Intake error:', err);
    return NextResponse.json(
      { error: err.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
