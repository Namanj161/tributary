'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function WikiPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState<any>(null);

  async function fetchArticles() {
    setLoading(true);
    const res = await fetch('/api/wiki');
    const data = await res.json();
    setArticles(data.articles || []);
    setLoading(false);
  }

  async function fetchArticle(topic: string) {
    const res = await fetch(`/api/wiki/article?topic=${encodeURIComponent(topic)}`);
    const data = await res.json();
    setSelectedArticle(data);
  }

  async function handleCompile() {
    setCompiling(true); setCompileResult(null);
    try {
      const res = await fetch('/api/wiki', { method: 'POST' });
      const data = await res.json();
      setCompileResult(data);
      fetchArticles();
    } catch (err: any) { setCompileResult({ error: err.message }); }
    setCompiling(false);
  }

  useEffect(() => { fetchArticles(); }, []);

  // Simple markdown renderer
  function renderMd(text: string) {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('## ')) return <h2 key={i} style={{ fontSize: 18, fontWeight: 700, fontFamily: "'Syne',sans-serif", marginTop: 24, marginBottom: 8, color: '#e8eaf0' }}>{line.slice(3)}</h2>;
      if (line.startsWith('### ')) return <h3 key={i} style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Syne',sans-serif", marginTop: 16, marginBottom: 6, color: '#c8cade' }}>{line.slice(4)}</h3>;
      if (line.startsWith('- ')) return <div key={i} style={{ paddingLeft: 16, fontSize: 14, lineHeight: 1.7, color: '#c8cade', marginBottom: 4 }}>• {line.slice(2)}</div>;
      if (line.trim() === '') return <div key={i} style={{ height: 8 }} />;
      // Handle [[wiki links]]
      const parts = line.split(/(\[\[[^\]]+\]\])/g);
      return (
        <p key={i} style={{ fontSize: 14, lineHeight: 1.8, color: '#c8cade', marginBottom: 4 }}>
          {parts.map((part, j) => {
            const wikiMatch = part.match(/^\[\[([^\]]+)\]\]$/);
            if (wikiMatch) {
              return <span key={j} onClick={() => fetchArticle(wikiMatch[1])} style={{ color: '#00e5a0', cursor: 'pointer', borderBottom: '1px dashed rgba(0,229,160,.3)' }}>{wikiMatch[1]}</span>;
            }
            return <span key={j}>{part}</span>;
          })}
        </p>
      );
    });
  }

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
            <span style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, color: '#2dd4bf', background: 'rgba(45,212,191,.1)' }}>Wiki</span>
            <Link href="/profile" style={{ padding: '6px 14px', borderRadius: 8, fontSize: 13, color: '#8b90a8', textDecoration: 'none' }}>Profile</Link>
          </nav>
        </div>
      </header>

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '100px 24px 80px' }}>
        {!selectedArticle ? (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
              <div>
                <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, marginBottom: 8 }}>
                  Wiki
                </h1>
                <p style={{ fontSize: 14, color: '#8b90a8', lineHeight: 1.6 }}>
                  Auto-compiled articles from your knowledge units. The more you feed TPIC, the richer these get.
                </p>
              </div>
              <button onClick={handleCompile} disabled={compiling} style={{
                padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none',
                cursor: compiling ? 'not-allowed' : 'pointer', flexShrink: 0,
                fontFamily: "'Syne',sans-serif",
                background: compiling ? '#1e2340' : 'linear-gradient(135deg,#2dd4bf,#00b894)',
                color: compiling ? '#4e5370' : '#06070b',
              }}>{compiling ? 'Compiling...' : '⟳ Compile Wiki'}</button>
            </div>

            {compileResult && (
              <div style={{ padding: 16, borderRadius: 12, marginBottom: 24, background: compileResult.error ? 'rgba(255,107,107,.08)' : 'rgba(0,229,160,.08)', border: `1px solid ${compileResult.error ? 'rgba(255,107,107,.15)' : 'rgba(0,229,160,.15)'}` }}>
                {compileResult.error ? (
                  <p style={{ fontSize: 13, color: '#ff6b6b' }}>{compileResult.error}</p>
                ) : (
                  <p style={{ fontSize: 13, color: '#00e5a0' }}>Compiled {compileResult.compiled} articles: {compileResult.topics?.join(', ')}</p>
                )}
              </div>
            )}

            {loading ? (
              <div style={{ padding: 60, textAlign: 'center' as const, color: '#4e5370' }}>Loading wiki...</div>
            ) : articles.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' as const }}>
                <div style={{ fontSize: 48, color: '#2a3050', marginBottom: 12 }}>📚</div>
                <p style={{ fontSize: 14, color: '#4e5370', marginBottom: 16 }}>No wiki articles yet. Feed TPIC some content, then hit "Compile Wiki" to generate articles from your knowledge units.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
                {articles.map(article => (
                  <div key={article.id} onClick={() => fetchArticle(article.topic)} style={{
                    padding: 20, borderRadius: 12, cursor: 'pointer',
                    background: '#151929', border: '1px solid #1c2035',
                    transition: 'border-color .2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: 17, fontWeight: 700, fontFamily: "'Syne',sans-serif", textTransform: 'capitalize' as const }}>{article.topic}</h3>
                      <div style={{ display: 'flex', gap: 12 }}>
                        <span style={{ fontSize: 10, color: '#2dd4bf', fontFamily: "'JetBrains Mono',monospace" }}>{article.unit_count} units</span>
                        <span style={{ fontSize: 10, color: '#6c5ce7', fontFamily: "'JetBrains Mono',monospace" }}>{article.source_count} sources</span>
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: '#3a3f5a', fontFamily: "'JetBrains Mono',monospace", marginTop: 6 }}>
                      Last compiled: {new Date(article.last_compiled).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <button onClick={() => setSelectedArticle(null)} style={{ fontSize: 13, color: '#2dd4bf', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0 }}>← Back to Wiki</button>

            <div style={{ padding: 28, borderRadius: 14, background: '#10131e', border: '1px solid #1c2035', position: 'relative' as const, overflow: 'hidden' }}>
              <div style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, height: 2, background: 'linear-gradient(90deg,#2dd4bf,#00b894,transparent)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h1 style={{ fontSize: 26, fontWeight: 800, fontFamily: "'Syne',sans-serif", textTransform: 'capitalize' as const }}>{selectedArticle.topic}</h1>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: 'rgba(45,212,191,.1)', color: '#2dd4bf', fontFamily: "'JetBrains Mono',monospace" }}>{selectedArticle.unit_count} units</span>
                  <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 6, background: 'rgba(108,92,231,.1)', color: '#6c5ce7', fontFamily: "'JetBrains Mono',monospace" }}>{selectedArticle.source_count} sources</span>
                </div>
              </div>
              <div>{renderMd(selectedArticle.content)}</div>
            </div>
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
