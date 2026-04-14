'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

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

const RELATIONSHIP_STYLES: Record<string, { label: string; color: string; icon: string }> = {
  reinforces: { label: 'Reinforces', color: '#00e5a0', icon: '⟁' },
  contradicts: { label: 'Contradicts', color: '#ff6b6b', icon: '⟐' },
  extends: { label: 'Extends', color: '#6c5ce7', icon: '→' },
  contextualizes: { label: 'Contextualizes', color: '#f5a623', icon: '◎' },
  parallels: { label: 'Parallels', color: '#2dd4bf', icon: '∥' },
};

const ALL_TYPES = Object.keys(TYPE_LABELS);

export default function KnowledgeBase() {
  const [units, setUnits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeType, setActiveType] = useState<string | null>(null);
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [stats, setStats] = useState({ total_units: 0, total_sources: 0, total_connections: 0 });
  const [searchFocused, setSearchFocused] = useState(false);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);

  async function fetchUnits() {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeType) params.set('type', activeType);
    if (activeTag) params.set('tag', activeTag);
    if (search) params.set('search', search);
    try {
      const res = await fetch(`/api/knowledge?${params.toString()}`);
      const data = await res.json();
      setUnits(data.units || []);
      setAvailableTags(data.available_tags || []);
      setStats(data.stats || { total_units: 0, total_sources: 0, total_connections: 0 });
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  useEffect(() => { fetchUnits(); }, [activeType, activeTag]);
  useEffect(() => { const t = setTimeout(fetchUnits, 300); return () => clearTimeout(t); }, [search]);

  return (
    <div style={{ minHeight: '100vh', background: '#06070b', fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#e8eaf0' }}>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(6,7,11,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1c2035' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #00e5a0, #6c5ce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#06070b', fontFamily: "'Syne', sans-serif" }}>T</div>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif" }}>TPIC</span>
          </Link>
          <nav style={{ display: 'flex', gap: 4 }}>
            <Link href="/" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, color: '#8b90a8', textDecoration: 'none' }}>Intake</Link>
            <span style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, fontWeight: 600, color: "#00e5a0", background: "rgba(0,229,160,0.1)" }}>Knowledge Base</span>
            <Link href="/graph" style={{ padding: "6px 14px", borderRadius: 8, fontSize: 13, color: "#8b90a8", textDecoration: "none" }}>Graph</Link>
          <Link href="/query" style={{padding:"6px 14px",borderRadius:8,fontSize:13,color:"#8b90a8",textDecoration:"none"}}>Query</Link>
            <Link href="/profile" style={{padding:"6px 14px",borderRadius:8,fontSize:13,color:"#8b90a8",textDecoration:"none"}}>Profile</Link>
            </nav>
        </div>
      </header>

      <main style={{ maxWidth: 960, margin: '0 auto', padding: '100px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>Knowledge Base</h1>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", color: '#4e5370' }}>
            <span><span style={{ color: '#00e5a0' }}>{stats.total_units}</span> units</span>
            <span style={{ color: '#2a3050' }}>·</span>
            <span><span style={{ color: '#6c5ce7' }}>{stats.total_sources}</span> sources</span>
            <span style={{ color: '#2a3050' }}>·</span>
            <span><span style={{ color: '#f5a623' }}>{stats.total_connections}</span> connections</span>
          </div>
        </div>

        <div style={{ borderRadius: 12, overflow: 'hidden', marginBottom: 16, background: '#10131e', border: `1px solid ${searchFocused ? '#00e5a0' : '#1c2035'}`, boxShadow: searchFocused ? '0 0 30px rgba(0,229,160,0.06)' : 'none', transition: 'all 0.2s' }}>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} onFocus={() => setSearchFocused(true)} onBlur={() => setSearchFocused(false)} placeholder="Search knowledge base..."
            style={{ width: '100%', padding: '14px 20px', fontSize: 14, outline: 'none', background: 'transparent', color: '#e8eaf0', border: 'none', fontFamily: "'DM Sans', sans-serif" }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 12 }}>
          <button onClick={() => setActiveType(null)} style={{
            padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            background: !activeType ? '#00e5a0' : '#151929', color: !activeType ? '#06070b' : '#8b90a8',
            border: `1px solid ${!activeType ? '#00e5a0' : '#1c2035'}`, fontFamily: "'JetBrains Mono', monospace",
          }}>All</button>
          {ALL_TYPES.map((type) => {
            const c = TYPE_COLORS[type]; const isActive = activeType === type;
            return (
              <button key={type} onClick={() => setActiveType(isActive ? null : type)} style={{
                padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                background: c.bg, color: c.color, border: `1px solid ${c.border}`,
                fontFamily: "'JetBrains Mono', monospace", opacity: activeType && !isActive ? 0.35 : 1, transition: 'opacity 0.2s',
              }}>{TYPE_LABELS[type]}</button>
            );
          })}
        </div>

        {availableTags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 6, marginBottom: 24 }}>
            {availableTags.slice(0, 25).map((tag) => (
              <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} style={{
                padding: '4px 10px', borderRadius: 6, fontSize: 10, cursor: 'pointer',
                background: activeTag === tag ? 'rgba(0,229,160,0.1)' : '#151929',
                color: activeTag === tag ? '#00e5a0' : '#4e5370',
                border: `1px solid ${activeTag === tag ? 'rgba(0,229,160,0.3)' : '#1c2035'}`,
                fontFamily: "'JetBrains Mono', monospace",
              }}>#{tag}</button>
            ))}
          </div>
        )}

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {[1,2,3,4,5].map((i) => (
              <div key={i} style={{ height: 100, borderRadius: 12, background: 'linear-gradient(90deg, #151929 25%, #1e2340 50%, #151929 75%)', backgroundSize: '200% 100%', animation: `shimmer 1.5s ${i*0.1}s infinite` }} />
            ))}
          </div>
        ) : units.length === 0 ? (
          <div style={{ textAlign: 'center' as const, padding: '80px 0' }}>
            <div style={{ fontSize: 48, color: '#2a3050', fontFamily: "'Syne', sans-serif", marginBottom: 12 }}>∅</div>
            <p style={{ fontSize: 14, color: '#4e5370' }}>{stats.total_units === 0 ? 'Your knowledge base is empty. Go to Intake and feed it something.' : 'No units match your current filters.'}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {units.map((unit) => {
              const c = TYPE_COLORS[unit.type] || TYPE_COLORS.claim;
              const conns = unit.connections || [];
              const isExpanded = expandedUnit === unit.id;
              return (
                <div key={unit.id}>
                  <div style={{
                    padding: 18, borderRadius: 12, background: '#151929',
                    border: `1px solid ${conns.length > 0 ? '#2a3050' : '#1c2035'}`,
                    display: 'flex', gap: 12, alignItems: 'flex-start',
                    cursor: conns.length > 0 ? 'pointer' : 'default',
                  }} onClick={() => conns.length > 0 && setExpandedUnit(isExpanded ? null : unit.id)}>
                    <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 10px', borderRadius: 6, background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontFamily: "'JetBrains Mono', monospace", whiteSpace: 'nowrap' as const, flexShrink: 0 }}>{TYPE_LABELS[unit.type]}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, lineHeight: 1.7, color: '#e8eaf0' }}>{unit.content}</p>
                      {unit.context && <p style={{ fontSize: 12, color: '#4e5370', marginTop: 6, lineHeight: 1.5 }}>{unit.context}</p>}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' as const }}>
                        {unit.tags?.map((tag: string) => (
                          <span key={tag} onClick={(e) => { e.stopPropagation(); setActiveTag(tag); }} style={{ fontSize: 10, color: activeTag === tag ? '#00e5a0' : '#4e5370', cursor: 'pointer', fontFamily: "'JetBrains Mono', monospace" }}>#{tag}</span>
                        ))}
                        {conns.length > 0 && (
                          <span style={{ fontSize: 10, marginLeft: 'auto', padding: '2px 8px', borderRadius: 4, background: 'rgba(245,166,35,0.1)', color: '#f5a623', fontFamily: "'JetBrains Mono', monospace" }}>⟁ {conns.length} {conns.length === 1 ? 'connection' : 'connections'}</span>
                        )}
                        {conns.length === 0 && unit.source && (
                          <span style={{ fontSize: 10, color: '#2a3050', marginLeft: 'auto', fontFamily: "'JetBrains Mono', monospace" }}>{unit.source.title?.slice(0, 45)}{unit.source.title?.length > 45 ? '...' : ''}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isExpanded && conns.length > 0 && (
                    <div style={{ marginLeft: 20, marginTop: 4, marginBottom: 4, borderLeft: '2px solid #2a3050', paddingLeft: 16, display: 'flex', flexDirection: 'column' as const, gap: 6 }}>
                      {conns.map((conn: any) => {
                        const rel = RELATIONSHIP_STYLES[conn.relationship] || RELATIONSHIP_STYLES.reinforces;
                        const connUnit = conn.connected_unit;
                        const connColor = TYPE_COLORS[connUnit?.type || 'claim'] || TYPE_COLORS.claim;
                        return (
                          <div key={conn.id} style={{ padding: 14, borderRadius: 10, background: '#10131e', border: '1px solid #1c2035' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                              <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: `${rel.color}15`, color: rel.color, fontFamily: "'JetBrains Mono', monospace" }}>{rel.icon} {rel.label}</span>
                              <span style={{ fontSize: 9, padding: '2px 6px', borderRadius: 4, background: connColor.bg, color: connColor.color, fontFamily: "'JetBrains Mono', monospace" }}>{TYPE_LABELS[connUnit?.type] || 'Unit'}</span>
                              <span style={{ fontSize: 9, color: '#4e5370', fontFamily: "'JetBrains Mono', monospace" }}>{conn.direction === 'outgoing' ? '→' : '←'}</span>
                            </div>
                            <p style={{ fontSize: 13, lineHeight: 1.6, color: '#c8cade' }}>{connUnit?.content || 'Connected unit'}</p>
                            {conn.note && <p style={{ fontSize: 11, color: '#8b90a8', marginTop: 6, fontStyle: 'italic' as const }}>{conn.note}</p>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        input::placeholder { color: #3a3f5a; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #2a3050; border-radius: 3px; }
      `}</style>
    </div>
  );
}
