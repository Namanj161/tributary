import { NextRequest, NextResponse } from 'next/server';
import { extractPDF } from '@/lib/extractors/pdf';
import { deconstructContent, discoverConnections } from '@/lib/claude';
import { supabase } from '@/lib/supabase';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json({ error: 'Only PDF files are supported' }, { status: 400 });
    }

    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 20MB.' }, { status: 400 });
    }

    // Read file into buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF
    const extracted = await extractPDF(buffer, file.name);

    // Store source
    const { data: source, error: sourceError } = await supabase
      .from('sources')
      .insert({
        type: extracted.type,
        title: extracted.title,
        url: null,
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

    // Deconstruct
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
        warning: 'No knowledge units were extracted from this PDF.',
      });
    }

    // Store units
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

    await supabase.from('sources').update({ knowledge_unit_count: knowledgeUnits.length }).eq('id', source.id);

    // Connection discovery
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
            const { data: inserted, error: connErr } = await supabase
              .from('connections')
              .insert(connectionsToInsert)
              .select('*, source_unit:knowledge_units!connections_source_unit_id_fkey(id, type, content, tags), target_unit:knowledge_units!connections_target_unit_id_fkey(id, type, content, tags)');
            if (!connErr) connectionsFound = inserted || [];
          }
        }
      }
    } catch (connErr) {
      console.error('Connection discovery error (non-fatal):', connErr);
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
        total_connections: totalConnections || 0,
      },
    });
  } catch (err: any) {
    console.error('Upload error:', err);
    return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
  }
}
