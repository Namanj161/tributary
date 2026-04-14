'use client';
import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Nav from '@/components/Nav';

const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), { ssr: false });

const TC: Record<string,string> = { framework:'#a78bfa',tactic:'#00e5a0',claim:'#60a5fa',insight:'#f5a623',story:'#f472b6',number:'#2dd4bf',question:'#ff6b6b',principle:'#d4b42d',example:'#67b7f7',warning:'#fb923c' };
const RC: Record<string,string> = { reinforces:'#00e5a0',contradicts:'#ff6b6b',extends:'#6c5ce7',contextualizes:'#f5a623',parallels:'#2dd4bf' };

function WikiPageInner() {
  const searchParams = useSearchParams();
  const [articles, setArticles] = useState<any[]>([]);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [missingTopic, setMissingTopic] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [compiling, setCompiling] = useState(false);
  const [compileResult, setCompileResult] = useState<any>(null);
  const [miniGraph, setMiniGraph] = useState<{nodes:any[];links:any[]}>({nodes:[],links:[]});
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [pinnedNode, setPinnedNode] = useState<any>(null);
  const miniRef = useRef<any>(null);

  async function fetchArticles() {
    setLoading(true);
    const res = await fetch('/api/wiki');
    const data = await res.json();
    setArticles(data.articles || []);
    setLoading(false);
  }

  const fetchArticle = useCallback(async (topic: string) => {
    setMissingTopic(null);
    setPinnedNode(null);
    setHoveredNode(null);
    const res = await fetch(`/api/wiki/article?topic=${encodeURIComponent(topic)}`);
    if (!res.ok) {
      setSelectedArticle(null);
      setMissingTopic(topic);
      return;
    }
    const data = await res.json();
    setSelectedArticle(data);
  }, []);

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

  // Auto-open article from ?topic= URL param
  useEffect(() => {
    const t = searchParams.get('topic');
    if (t) fetchArticle(t);
  }, [searchParams, fetchArticle]);

  // Build the mini graph whenever a wiki article is opened
  useEffect(() => {
    if (!selectedArticle?.unit_ids?.length) {
      setMiniGraph({ nodes: [], links: [] });
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await fetch('/api/graph');
      const data = await res.json();
      if (cancelled) return;
      const unitIdSet = new Set<string>(selectedArticle.unit_ids);
      const nodes = data.nodes.filter((n: any) => unitIdSet.has(n.id));
      const links = data.edges.filter((e: any) => unitIdSet.has(e.source) && unitIdSet.has(e.target));
      setMiniGraph({ nodes, links });
      setTimeout(() => miniRef.current?.zoomToFit(400, 40), 300);
    })();
    return () => { cancelled = true; };
  }, [selectedArticle]);

  const paintMiniNode = useCallback((node: any, ctx: CanvasRenderingContext2D, scale: number) => {
    const col = TC[node.type] || '#8b90a8';
    const isActive = pinnedNode?.id === node.id || hoveredNode?.id === node.id;
    const r = isActive ? 6 : 4;
    if (isActive) {
      ctx.globalAlpha = .15;
      ctx.beginPath(); ctx.arc(node.x, node.y, r * 2.5, 0, Math.PI * 2);
      ctx.fillStyle = col; ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.beginPath(); ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
    ctx.fillStyle = col; ctx.fill();
    if (isActive) {
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; ctx.stroke();
    }
  }, [hoveredNode, pinnedNode]);

  const paintMiniLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    ctx.strokeStyle = RC[link.relationship] || 'rgba(80,90,130,.45)';
    ctx.globalAlpha = .55;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(link.source.x, link.source.y);
    ctx.lineTo(link.target.x, link.target.y);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }, []);

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

  const activeNode = pinnedNode || hoveredNode;

  return (
    <div style={{ minHeight: '100vh', background: '#06070b', fontFamily: "'DM Sans',sans-serif", color: '#e8eaf0' }}>
      <Nav />

      <main style={{ maxWidth: 800, margin: '0 auto', padding: '100px 24px 80px' }}>
        {missingTopic && !selectedArticle ? (
          <div>
            <button onClick={() => { setMissingTopic(null); }} style={{ fontSize: 13, color: '#2dd4bf', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0 }}>← Back to Wiki</button>
            <div style={{ padding: 40, borderRadius: 14, background: '#10131e', border: '1px solid #1c2035', textAlign: 'center' as const }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
              <h2 style={{ fontSize: 20, fontWeight: 700, fontFamily: "'Syne',sans-serif", textTransform: 'capitalize' as const, marginBottom: 8 }}>{missingTopic}</h2>
              <p style={{ fontSize: 13, color: '#8b90a8' }}>Not yet compiled. Hit "Compile Wiki" on the index to generate this article.</p>
            </div>
          </div>
        ) : !selectedArticle ? (
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
              <div style={{ display: 'flex', flexDirection: 'column' as const, alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <button onClick={handleCompile} disabled={compiling} style={{
                  padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700, border: 'none',
                  cursor: compiling ? 'not-allowed' : 'pointer',
                  fontFamily: "'Syne',sans-serif",
                  background: compiling ? '#1e2340' : 'linear-gradient(135deg,#2dd4bf,#00b894)',
                  color: compiling ? '#4e5370' : '#06070b',
                }}>{compiling ? 'Compiling...' : '⟳ Compile Wiki'}</button>
                {articles.length > 0 && (() => {
                  const latest = articles.reduce((acc: any, a: any) => {
                    if (!a.last_compiled) return acc;
                    if (!acc) return a.last_compiled;
                    return new Date(a.last_compiled) > new Date(acc) ? a.last_compiled : acc;
                  }, null as string | null);
                  if (!latest) return null;
                  return (
                    <span style={{ fontSize: 10, color: '#4e5370', fontFamily: "'JetBrains Mono',monospace" }}>
                      Last compiled {new Date(latest).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  );
                })()}
              </div>
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
            <button onClick={() => { setSelectedArticle(null); setMissingTopic(null); }} style={{ fontSize: 13, color: '#2dd4bf', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 24, padding: 0 }}>← Back to Wiki</button>

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

            {/* Mini knowledge graph */}
            {miniGraph.nodes.length > 0 && (
              <div style={{ marginTop: 24, padding: 20, borderRadius: 14, background: '#10131e', border: '1px solid #1c2035' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase' as const, letterSpacing: '.1em', color: '#8b90a8' }}>Article Graph</h3>
                  <span style={{ fontSize: 10, color: '#4e5370', fontFamily: "'JetBrains Mono',monospace" }}>{miniGraph.nodes.length} nodes · {miniGraph.links.length} edges</span>
                </div>
                <div style={{ position: 'relative' as const, height: 360, borderRadius: 10, background: '#06070b', border: '1px solid #1c2035', overflow: 'hidden' }}>
                  <ForceGraph2D
                    ref={miniRef}
                    width={752}
                    height={360}
                    graphData={miniGraph}
                    backgroundColor="#06070b"
                    nodeCanvasObject={paintMiniNode}
                    linkCanvasObject={paintMiniLink}
                    nodeRelSize={4}
                    onNodeClick={(node: any) => setPinnedNode((prev: any) => prev?.id === node.id ? null : node)}
                    onNodeHover={(node: any) => setHoveredNode(node || null)}
                    onBackgroundClick={() => setPinnedNode(null)}
                    cooldownTicks={80}
                    d3AlphaDecay={0.03}
                  />
                  {activeNode && (
                    <div style={{ position: 'absolute' as const, left: 12, bottom: 12, right: 12, maxWidth: 520, padding: 12, borderRadius: 10, background: 'rgba(16,19,30,.96)', border: '1px solid #1c2035', pointerEvents: 'none' as const }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4, background: (TC[activeNode.type] || '#888') + '20', color: TC[activeNode.type] || '#888', fontFamily: "'JetBrains Mono',monospace" }}>{activeNode.type}</span>
                        <span style={{ fontSize: 9, color: '#4e5370', fontFamily: "'JetBrains Mono',monospace" }}>{activeNode.sourceTitle}</span>
                      </div>
                      <p style={{ fontSize: 12, lineHeight: 1.55, color: '#e8eaf0' }}>{activeNode.fullContent}</p>
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 10, color: '#4e5370', marginTop: 8, fontFamily: "'JetBrains Mono',monospace" }}>Click a node to pin it · hover to preview</p>
              </div>
            )}
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

export default function WikiPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#06070b' }} />}>
      <WikiPageInner />
    </Suspense>
  );
}
