'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

const URG: Record<string, { bg: string; color: string; label: string }> = {
  now: { bg: 'rgba(255,107,107,.1)', color: '#ff6b6b', label: 'NOW' },
  this_week: { bg: 'rgba(245,166,35,.1)', color: '#f5a623', label: 'THIS WEEK' },
  when_relevant: { bg: 'rgba(96,165,250,.1)', color: '#60a5fa', label: 'WHEN RELEVANT' },
};

export default function ActionsPage() {
  const [actions, setActions] = useState<any[]>([]);
  const [stats, setStats] = useState({ pending: 0, done: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'done' | 'skipped'>('pending');

  async function fetchActions() {
    setLoading(true);
    const res = await fetch('/api/actions');
    const data = await res.json();
    setActions(data.actions || []);
    setStats(data.stats || { pending: 0, done: 0, total: 0 });
    setLoading(false);
  }

  useEffect(() => { fetchActions(); }, []);

  async function updateAction(id: string, status: string) {
    await fetch('/api/actions', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    fetchActions();
  }

  const filtered = actions.filter(a => filter === 'all' || a.status === filter);

  return (
    <div style={{ minHeight: '100vh', background: '#06070b', fontFamily: "'DM Sans',sans-serif", color: '#e8eaf0' }}>
      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(6,7,11,.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1c2035' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit' }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#00e5a0,#6c5ce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#06070b', fontFamily: "'Syne',sans-serif" }}>T</div>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>TPIC</span>
          </Link>
          <nav style={{ display: 'flex', gap: 4 }}>
            <Link href="/" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, color: '#8b90a8', textDecoration: 'none' }}>Intake</Link>
            <Link href="/knowledge" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, color: '#8b90a8', textDecoration: 'none' }}>Knowledge Base</Link>
            <Link href="/graph" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, color: '#8b90a8', textDecoration: 'none' }}>Graph</Link>
            <Link href="/query" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, color: '#8b90a8', textDecoration: 'none' }}>Query</Link>
            <span style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#ff6b6b', background: 'rgba(255,107,107,.1)' }}>Actions</span>
            <Link href="/profile" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, color: '#8b90a8', textDecoration: 'none' }}>Profile</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 700, margin: '0 auto', padding: '100px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
            Actions
          </h1>
          <div style={{ display: 'flex', gap: 16, fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: '#4e5370' }}>
            <span><span style={{ color: '#ff6b6b' }}>{stats.pending}</span> pending</span>
            <span style={{ color: '#2a3050' }}>·</span>
            <span><span style={{ color: '#00e5a0' }}>{stats.done}</span> done</span>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24 }}>
          {(['pending', 'done', 'skipped', 'all'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '5px 14px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: filter === f ? 'rgba(0,229,160,.12)' : '#151929',
              color: filter === f ? '#00e5a0' : '#4e5370',
              fontFamily: "'JetBrains Mono',monospace",
            }}>{f}</button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' as const, color: '#4e5370' }}>Loading actions...</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 60, textAlign: 'center' as const }}>
            <div style={{ fontSize: 48, color: '#2a3050', marginBottom: 12 }}>✓</div>
            <p style={{ fontSize: 14, color: '#4e5370' }}>
              {filter === 'pending' ? 'No pending actions. Feed TPIC some content to generate new ones.' : 'No actions in this filter.'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
            {filtered.map(action => {
              const u = URG[action.urgency] || URG.when_relevant;
              const isDone = action.status === 'done';
              const isSkipped = action.status === 'skipped';
              return (
                <div key={action.id} style={{
                  padding: 18, borderRadius: 12,
                  background: '#151929', border: '1px solid #1c2035',
                  opacity: isDone || isSkipped ? 0.5 : 1,
                  transition: 'opacity .2s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {/* Checkbox */}
                    <button onClick={() => updateAction(action.id, isDone ? 'pending' : 'done')} style={{
                      width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 2,
                      border: `2px solid ${isDone ? '#00e5a0' : '#2a3050'}`,
                      background: isDone ? 'rgba(0,229,160,.15)' : 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, color: '#00e5a0',
                    }}>{isDone ? '✓' : ''}</button>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                          background: u.bg, color: u.color, fontFamily: "'JetBrains Mono',monospace",
                        }}>{u.label}</span>
                        {action.source?.title && (
                          <span style={{ fontSize: 9, color: '#3a3f5a', fontFamily: "'JetBrains Mono',monospace" }}>
                            from: {action.source.title.slice(0, 35)}{action.source.title.length > 35 ? '...' : ''}
                          </span>
                        )}
                      </div>
                      <p style={{
                        fontSize: 14, lineHeight: 1.7, color: '#e8eaf0',
                        textDecoration: isDone ? 'line-through' : 'none',
                      }}>{action.action}</p>
                      {action.based_on && (
                        <p style={{ fontSize: 11, color: '#4e5370', marginTop: 4 }}>{action.based_on}</p>
                      )}
                    </div>

                    {/* Skip button */}
                    {!isDone && !isSkipped && (
                      <button onClick={() => updateAction(action.id, 'skipped')} style={{
                        background: 'none', border: 'none', color: '#2a3050', cursor: 'pointer',
                        fontSize: 14, flexShrink: 0, padding: 4,
                      }}>✕</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:#2a3050;border-radius:3px;}
      `}</style>
    </div>
  );
}
