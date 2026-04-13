'use client';

import { useState } from 'react';
import { IntakeBrief, BulkBrief } from '@/types';
import Brief from '@/components/Brief';
import BulkBriefView from '@/components/BulkBrief';
import Link from 'next/link';

export default function Home() {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [brief, setBrief] = useState<IntakeBrief | null>(null);
  const [bulkBrief, setBulkBrief] = useState<BulkBrief | null>(null);
  const [error, setError] = useState('');
  const [inputFocused, setInputFocused] = useState(false);

  async function handleSingleIntake() {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setBrief(null);
    setStatus('Extracting content...');
    try {
      setTimeout(() => setStatus('Deconstructing into knowledge units...'), 3000);
      setTimeout(() => setStatus('Discovering connections...'), 8000);
      setTimeout(() => setStatus('Mapping to knowledge base...'), 12000);
      const response = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: input.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Intake failed');
      setBrief(data);
      setStatus('');
      setInput('');
    } catch (err: any) {
      setError(err.message);
      setStatus('');
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkIntake() {
    const lines = input.trim().split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    if (lines.length > 10) { setError('Maximum 10 items per bulk import'); return; }
    setLoading(true);
    setError('');
    setBulkBrief(null);
    setStatus(`Processing ${lines.length} sources...`);
    try {
      let count = 0;
      const timer = setInterval(() => {
        count++;
        if (count <= lines.length) setStatus(`Processing source ${count}/${lines.length}...`);
        else setStatus('Discovering connections across all new units...');
      }, 5000);
      const response = await fetch('/api/bulk-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inputs: lines }),
      });
      clearInterval(timer);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Bulk intake failed');
      setBulkBrief(data);
      setStatus('');
      setInput('');
    } catch (err: any) {
      setError(err.message);
      setStatus('');
    } finally {
      setLoading(false);
    }
  }

  function handleIntake() {
    if (mode === 'single') handleSingleIntake();
    else handleBulkIntake();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey && mode === 'single') { e.preventDefault(); handleIntake(); }
  }

  function handleReset() { setBrief(null); setBulkBrief(null); setError(''); setStatus(''); }

  const showResults = brief || bulkBrief;

  return (
    <div style={{ minHeight: '100vh', background: '#06070b', fontFamily: "'DM Sans', -apple-system, sans-serif", color: '#e8eaf0' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 20% 30%, rgba(0,229,160,0.06) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(108,92,231,0.04) 0%, transparent 40%)', pointerEvents: 'none' }} />

      <header style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50, background: 'rgba(6,7,11,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #1c2035' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #00e5a0, #6c5ce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#06070b', fontFamily: "'Syne', sans-serif" }}>T</div>
            <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Syne', sans-serif", letterSpacing: '0.02em' }}>TPIC</span>
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#1e2340', color: '#4e5370', fontFamily: "'JetBrains Mono', monospace" }}>v1</span>
          </div>
          <nav style={{ display: 'flex', gap: 4 }}>
            <span style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#00e5a0', background: 'rgba(0,229,160,0.1)' }}>Intake</span>
            <Link href="/knowledge" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, color: '#8b90a8', textDecoration: 'none' }}>Knowledge Base</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '120px 24px 80px' }}>
        {!showResults && (
          <div>
            <div style={{ marginBottom: 48 }}>
              <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 800, lineHeight: 1.1, marginBottom: 14, letterSpacing: '-0.02em' }}>
                Feed it anything.<br /><span style={{ color: '#00e5a0' }}>Extract the substance.</span>
              </h1>
              <p style={{ fontSize: 15, color: '#8b90a8', lineHeight: 1.65, maxWidth: 440 }}>
                Paste a YouTube video, blog post, or raw text. TPIC deconstructs it into atomic knowledge units, discovers connections, and compounds it with everything you've already consumed.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 2, marginBottom: 16, padding: 3, borderRadius: 10, background: '#10131e', border: '1px solid #1c2035', width: 'fit-content' }}>
              {(['single', 'bulk'] as const).map((m) => (
                <button key={m} onClick={() => setMode(m)} style={{
                  padding: '7px 18px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer',
                  fontFamily: "'JetBrains Mono', monospace",
                  background: mode === m ? 'rgba(0,229,160,0.12)' : 'transparent',
                  color: mode === m ? '#00e5a0' : '#4e5370', transition: 'all 0.2s',
                }}>{m === 'single' ? 'Single' : 'Bulk Import'}</button>
              ))}
            </div>

            <div style={{
              borderRadius: 14, overflow: 'hidden', background: '#10131e',
              border: `1px solid ${inputFocused ? '#00e5a0' : '#1c2035'}`,
              boxShadow: inputFocused ? '0 0 0 1px #00e5a0, 0 0 40px rgba(0,229,160,0.08)' : 'none',
              transition: 'all 0.2s ease',
            }}>
              <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)}
                placeholder={mode === 'single' ? 'https://youtube.com/watch?v=... or paste text directly' : 'Paste one URL per line (max 10)\nhttps://youtube.com/watch?v=...\nhttps://example.com/article'}
                disabled={loading} rows={mode === 'single' ? 4 : 7}
                style={{
                  width: '100%', padding: 20, fontSize: mode === 'bulk' ? 13 : 15, resize: 'none',
                  outline: 'none', background: 'transparent', color: '#e8eaf0',
                  fontFamily: mode === 'bulk' ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
                  lineHeight: 1.6, border: 'none',
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderTop: '1px solid #1c2035' }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {mode === 'single' ? (
                    ['YouTube', 'Article', 'Raw Text'].map((t) => (
                      <span key={t} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 4, background: '#1e2340', color: '#4e5370', fontFamily: "'JetBrains Mono', monospace" }}>{t}</span>
                    ))
                  ) : (
                    <span style={{ fontSize: 11, color: '#4e5370', fontFamily: "'JetBrains Mono', monospace" }}>{input.trim().split('\n').filter(Boolean).length}/10 sources</span>
                  )}
                </div>
                <button onClick={handleIntake} disabled={loading || !input.trim()} style={{
                  padding: '8px 22px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: "'Syne', sans-serif", letterSpacing: '0.02em',
                  background: loading || !input.trim() ? '#1e2340' : 'linear-gradient(135deg, #00e5a0, #00b880)',
                  color: loading || !input.trim() ? '#4e5370' : '#06070b', transition: 'all 0.2s ease',
                }}>{loading ? 'Processing...' : mode === 'single' ? 'Extract' : `Import ${input.trim().split('\n').filter(Boolean).length} Sources`}</button>
              </div>
            </div>

            {error && <div style={{ marginTop: 20, padding: 16, borderRadius: 12, fontSize: 14, background: 'rgba(255,107,107,0.08)', border: '1px solid rgba(255,107,107,0.15)', color: '#ff6b6b', lineHeight: 1.5 }}>{error}</div>}

            {loading && (
              <div style={{ marginTop: 48 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
                  <div style={{ display: 'flex', gap: 3 }}>
                    {[0,1,2,3].map((i) => (
                      <div key={i} style={{ width: 4, height: 24 + i * 6, borderRadius: 2, background: '#00e5a0', opacity: 0.3 + i * 0.15, animation: `pulse 1s ease-in-out ${i * 0.15}s infinite` }} />
                    ))}
                  </div>
                  <span style={{ fontSize: 13, color: '#8b90a8', fontFamily: "'JetBrains Mono', monospace" }}>{status}</span>
                </div>
                {[1,2,3].map((i) => (
                  <div key={i} style={{ height: 88, borderRadius: 12, marginBottom: 10, background: 'linear-gradient(90deg, #151929 25%, #1e2340 50%, #151929 75%)', backgroundSize: '200% 100%', animation: `shimmer 1.5s ${i * 0.2}s infinite` }} />
                ))}
              </div>
            )}

            {!loading && !error && (
              <div style={{ marginTop: 64 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#00e5a0' }} />
                  <span style={{ fontSize: 10, color: '#4e5370', textTransform: 'uppercase' as const, letterSpacing: '0.12em', fontFamily: "'JetBrains Mono', monospace" }}>How it works</span>
                  <div style={{ flex: 1, height: 1, background: '#1c2035' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    { step: '01', title: 'Extract', desc: 'Pull full substance from any URL or text', color: '#00e5a0' },
                    { step: '02', title: 'Deconstruct', desc: 'Break into tagged atomic knowledge units', color: '#6c5ce7' },
                    { step: '03', title: 'Connect', desc: 'Find links to your existing knowledge', color: '#f5a623' },
                    { step: '04', title: 'Compound', desc: 'Intelligence grows with every source', color: '#2dd4bf' },
                  ].map((item) => (
                    <div key={item.step} style={{ padding: 18, borderRadius: 12, background: '#151929', border: '1px solid #1c2035' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: item.color, fontFamily: "'JetBrains Mono', monospace" }}>{item.step}</span>
                      <h3 style={{ fontSize: 15, fontWeight: 700, marginTop: 8, marginBottom: 5, fontFamily: "'Syne', sans-serif" }}>{item.title}</h3>
                      <p style={{ fontSize: 11, color: '#4e5370', lineHeight: 1.5 }}>{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {showResults && (
          <div>
            <button onClick={handleReset} style={{ fontSize: 13, color: '#00e5a0', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 32, padding: 0 }}>← New intake</button>
            {brief && <Brief data={brief} />}
            {bulkBrief && <BulkBriefView data={bulkBrief} />}
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.7; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        textarea::placeholder { color: #3a3f5a; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { overflow-x: hidden; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-thumb { background: #2a3050; border-radius: 3px; }
      `}</style>
    </div>
  );
}
