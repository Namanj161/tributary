'use client';

import { IntakeBrief, KnowledgeUnit, Connection } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  framework: 'Framework', tactic: 'Tactic', claim: 'Claim', insight: 'Insight',
  story: 'Story', number: 'Number', question: 'Question', principle: 'Principle',
  example: 'Example', warning: 'Warning',
};

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  framework: { bg: 'rgba(108,92,231,0.12)', color: '#a78bfa', border: 'rgba(108,92,231,0.2)' },
  tactic: { bg: 'rgba(0,229,160,0.08)', color: '#00e5a0', border: 'rgba(0,229,160,0.15)' },
  claim: { bg: 'rgba(96,165,250,0.1)', color: '#60a5fa', border: 'rgba(96,165,250,0.18)' },
  insight: { bg: 'rgba(245,166,35,0.1)', color: '#f5a623', border: 'rgba(245,166,35,0.18)' },
  story: { bg: 'rgba(244,114,182,0.1)', color: '#f472b6', border: 'rgba(244,114,182,0.18)' },
  number: { bg: 'rgba(45,212,191,0.1)', color: '#2dd4bf', border: 'rgba(45,212,191,0.18)' },
  question: { bg: 'rgba(255,107,107,0.1)', color: '#ff6b6b', border: 'rgba(255,107,107,0.18)' },
  principle: { bg: 'rgba(212,180,45,0.1)', color: '#d4b42d', border: 'rgba(212,180,45,0.18)' },
  example: { bg: 'rgba(103,183,247,0.1)', color: '#67b7f7', border: 'rgba(103,183,247,0.18)' },
  warning: { bg: 'rgba(251,146,60,0.1)', color: '#fb923c', border: 'rgba(251,146,60,0.18)' },
};

const RELATIONSHIP_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  reinforces: { label: 'Reinforces', color: '#00e5a0', icon: '⟁' },
  contradicts: { label: 'Contradicts', color: '#ff6b6b', icon: '⟐' },
  extends: { label: 'Extends', color: '#6c5ce7', icon: '→' },
  contextualizes: { label: 'Contextualizes', color: '#f5a623', icon: '◎' },
  parallels: { label: 'Parallels', color: '#2dd4bf', icon: '∥' },
};

const SOURCE_LABELS: Record<string, string> = {
  youtube: 'YouTube', twitter_thread: 'Twitter', blog_post: 'Blog Post',
  article: 'Article', raw_text: 'Text', notion_page: 'Notion',
};

function groupByType(units: KnowledgeUnit[]) {
  const groups: Record<string, KnowledgeUnit[]> = {};
  units.forEach((u) => { if (!groups[u.type]) groups[u.type] = []; groups[u.type].push(u); });
  return groups;
}

function Badge({ type }: { type: string }) {
  const c = TYPE_COLORS[type] || TYPE_COLORS.claim;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 6,
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' as const,
    }}>{TYPE_LABELS[type] || type}</span>
  );
}

function ConnectionCard({ connection }: { connection: Connection }) {
  const rel = RELATIONSHIP_LABELS[connection.relationship] || RELATIONSHIP_LABELS.reinforces;
  const sourceUnit = connection.source_unit;
  const targetUnit = connection.target_unit;
  const sourceColor = TYPE_COLORS[sourceUnit?.type || 'claim'] || TYPE_COLORS.claim;
  const targetColor = TYPE_COLORS[targetUnit?.type || 'claim'] || TYPE_COLORS.claim;

  return (
    <div style={{ padding: 16, borderRadius: 12, background: '#10131e', border: '1px solid #1c2035' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
          background: `${rel.color}15`, color: rel.color, border: `1px solid ${rel.color}30`,
          fontFamily: "'JetBrains Mono', monospace",
        }}>{rel.icon} {rel.label}</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        <div style={{ padding: 12, borderRadius: 8, background: '#151929', borderLeft: `3px solid ${sourceColor.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Badge type={sourceUnit?.type || 'claim'} />
            <span style={{ fontSize: 9, color: '#4e5370', fontFamily: "'JetBrains Mono', monospace" }}>NEW</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#e8eaf0' }}>{sourceUnit?.content || 'Unknown unit'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px' }}>
          <div style={{ flex: 1, height: 1, background: `${rel.color}30` }} />
          <span style={{ fontSize: 10, color: rel.color, fontFamily: "'JetBrains Mono', monospace" }}>{rel.icon}</span>
          <div style={{ flex: 1, height: 1, background: `${rel.color}30` }} />
        </div>
        <div style={{ padding: 12, borderRadius: 8, background: '#151929', borderLeft: `3px solid ${targetColor.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Badge type={targetUnit?.type || 'claim'} />
            <span style={{ fontSize: 9, color: '#4e5370', fontFamily: "'JetBrains Mono', monospace" }}>EXISTING</span>
          </div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: '#e8eaf0' }}>{targetUnit?.content || 'Unknown unit'}</p>
        </div>
      </div>
      {connection.note && (
        <p style={{ fontSize: 12, color: '#8b90a8', marginTop: 12, lineHeight: 1.5, fontStyle: 'italic' as const }}>{connection.note}</p>
      )}
    </div>
  );
}

export default function Brief({ data }: { data: IntakeBrief }) {
  const { source, knowledge_units, connections, stats } = data;
  const grouped = groupByType(knowledge_units);
  const orderedTypes = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  return (
    <div>
      <div style={{
        padding: 24, borderRadius: 14, marginBottom: 16,
        background: '#10131e', border: '1px solid #1c2035',
        position: 'relative' as const, overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg, #00e5a0, #6c5ce7, transparent)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#00e5a0', textTransform: 'uppercase' as const, letterSpacing: '0.12em', fontFamily: "'JetBrains Mono', monospace" }}>Intake Brief</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#00e5a0', animation: 'pulse 2s infinite' }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Syne', sans-serif", marginBottom: 12, lineHeight: 1.3 }}>{source.title}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' as const }}>
          <span style={{ fontSize: 10, padding: '4px 10px', borderRadius: 6, background: '#1e2340', color: '#00e5a0', fontFamily: "'JetBrains Mono', monospace" }}>{SOURCE_LABELS[source.type] || source.type}</span>
          {source.author && <span style={{ fontSize: 13, color: '#8b90a8' }}>{source.author}</span>}
          {source.url && <a href={source.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: '#4e5370', textDecoration: 'underline' }}>View source →</a>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 32 }}>
        {[
          { value: stats.units_added, label: 'Units extracted', color: '#00e5a0' },
          { value: stats.connections_found, label: 'Connections', color: '#f5a623' },
          { value: stats.total_units, label: 'Total in base', color: '#6c5ce7' },
          { value: stats.total_sources, label: 'Sources', color: '#2dd4bf' },
        ].map((s) => (
          <div key={s.label} style={{ padding: 16, borderRadius: 12, textAlign: 'center' as const, background: '#151929', border: '1px solid #1c2035' }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#4e5370', fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {connections && connections.length > 0 && (
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span style={{ fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 6, background: 'rgba(245,166,35,0.1)', color: '#f5a623', border: '1px solid rgba(245,166,35,0.2)', fontFamily: "'JetBrains Mono', monospace" }}>⟁ CONNECTIONS DISCOVERED</span>
            <div style={{ flex: 1, height: 1, background: '#1c2035' }} />
            <span style={{ fontSize: 11, color: '#4e5370', fontFamily: "'JetBrains Mono', monospace" }}>{connections.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {connections.map((conn) => <ConnectionCard key={conn.id} connection={conn} />)}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', gap: 2, height: 6, borderRadius: 3, overflow: 'hidden' }}>
          {orderedTypes.map(([type, units]) => {
            const c = TYPE_COLORS[type] || TYPE_COLORS.claim;
            return <div key={type} style={{ flex: units.length, background: c.color, opacity: 0.6 }} />;
          })}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 12, marginTop: 10 }}>
          {orderedTypes.map(([type, units]) => {
            const c = TYPE_COLORS[type] || TYPE_COLORS.claim;
            return (
              <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color, opacity: 0.6 }} />
                <span style={{ fontSize: 11, color: '#4e5370', fontFamily: "'JetBrains Mono', monospace" }}>{TYPE_LABELS[type]} ({units.length})</span>
              </div>
            );
          })}
        </div>
      </div>

      {orderedTypes.map(([type, units]) => (
        <div key={type} style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <Badge type={type} />
            <div style={{ flex: 1, height: 1, background: '#1c2035' }} />
            <span style={{ fontSize: 11, color: '#4e5370', fontFamily: "'JetBrains Mono', monospace" }}>{units.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {units.map((unit) => (
              <div key={unit.id} style={{ padding: 16, borderRadius: 12, background: '#151929', border: '1px solid #1c2035' }}>
                <p style={{ fontSize: 14, lineHeight: 1.7, color: '#e8eaf0' }}>{unit.content}</p>
                {unit.context && <p style={{ fontSize: 12, color: '#4e5370', marginTop: 8, lineHeight: 1.5 }}>{unit.context}</p>}
                {unit.tags && unit.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginTop: 10 }}>
                    {unit.tags.map((tag) => (
                      <span key={tag} style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: '#1e2340', color: '#4e5370', fontFamily: "'JetBrains Mono', monospace" }}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
