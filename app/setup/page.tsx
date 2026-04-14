'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SetupPage() {
  const [origin, setOrigin] = useState('http://localhost:3000');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Bookmarklet 1: Quick capture (background, shows toast)
  const quickCapture = `javascript:void(function(){var u=encodeURIComponent(location.href);var d=document.createElement('div');d.id='tpic-toast';d.style.cssText='position:fixed;top:20px;right:20px;z-index:999999;padding:16px 24px;border-radius:12px;background:rgba(6,7,11,0.95);border:1px solid rgba(0,229,160,0.3);color:rgb(232,234,240);font-family:system-ui;font-size:14px;box-shadow:0 8px 32px rgba(0,0,0,0.4);display:flex;align-items:center;gap:10px;';d.innerHTML='<div style=\"width:8px;height:8px;border-radius:50%;background:rgb(0,229,160);animation:tpulse 1s infinite\"></div>Sending to TPIC...';var s=document.createElement('style');s.textContent='@keyframes tpulse{0%,100%{opacity:.4}50%{opacity:1}}';document.head.appendChild(s);document.body.appendChild(d);fetch('${origin}/api/capture',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:decodeURIComponent(u)})}).then(function(r){return r.json()}).then(function(j){d.innerHTML='<div style=\"width:8px;height:8px;border-radius:50%;background:rgb(0,229,160)\"></div>'+j.units+' units extracted';setTimeout(function(){d.remove();s.remove()},3000)}).catch(function(){d.innerHTML='<div style=\"width:8px;height:8px;border-radius:50%;background:rgb(255,107,107)\"></div>Failed';setTimeout(function(){d.remove();s.remove()},3000)})})()`;

  // Bookmarklet 2: Open in TPIC (new tab with URL pre-filled)
  const openCapture = `javascript:void(window.open('${origin}?prefill='+encodeURIComponent(location.href),'_blank'))`;

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
          <Link href="/wiki" style={{padding:"6px 14px",borderRadius:8,fontSize:13,color:"#8b90a8",textDecoration:"none"}}>Wiki</Link>
            </nav>
        </div>
      </header>

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '100px 24px 80px' }}>
        <div style={{ marginBottom: 48 }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, marginBottom: 10 }}>
            Browser <span style={{ color: '#00e5a0' }}>Capture</span>
          </h1>
          <p style={{ fontSize: 14, color: '#8b90a8', lineHeight: 1.6 }}>
            Drag one of these to your bookmarks bar. Then click it on any page to send it to TPIC.
          </p>
        </div>

        {/* Bookmarklet 1: Quick Capture */}
        <div style={{ padding: 24, borderRadius: 14, background: '#10131e', border: '1px solid #1c2035', marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#00e5a0,#00b880)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#06070b', fontFamily: "'Syne',sans-serif" }}>⚡</div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>Quick Capture</h3>
              <p style={{ fontSize: 12, color: '#8b90a8' }}>Captures in background · shows toast notification</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#4e5370', lineHeight: 1.6, marginBottom: 16 }}>
            Click on any page — it extracts the content, finds connections, and shows you the result in a small toast. You never leave the page.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href={quickCapture} onClick={e => e.preventDefault()}
              onDragStart={e => e.dataTransfer.setData('text/plain', quickCapture)}
              style={{
                display: 'inline-block', padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: 'linear-gradient(135deg,#00e5a0,#00b880)', color: '#06070b',
                textDecoration: 'none', fontFamily: "'Syne',sans-serif", cursor: 'grab',
                letterSpacing: '.02em',
              }}>⚡ TPIC Capture</a>
            <span style={{ fontSize: 11, color: '#4e5370' }}>← drag this to your bookmarks bar</span>
          </div>
        </div>

        {/* Bookmarklet 2: Open in TPIC */}
        <div style={{ padding: 24, borderRadius: 14, background: '#10131e', border: '1px solid #1c2035', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#6c5ce7,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif" }}>↗</div>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, fontFamily: "'Syne',sans-serif" }}>Open in TPIC</h3>
              <p style={{ fontSize: 12, color: '#8b90a8' }}>Opens TPIC with URL pre-filled · see the full brief</p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: '#4e5370', lineHeight: 1.6, marginBottom: 16 }}>
            Click on any page — opens TPIC in a new tab with the URL already in the input. You see the full extraction brief.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <a href={openCapture} onClick={e => e.preventDefault()}
              onDragStart={e => e.dataTransfer.setData('text/plain', openCapture)}
              style={{
                display: 'inline-block', padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                background: 'linear-gradient(135deg,#6c5ce7,#a78bfa)', color: '#fff',
                textDecoration: 'none', fontFamily: "'Syne',sans-serif", cursor: 'grab',
                letterSpacing: '.02em',
              }}>↗ Open in TPIC</a>
            <span style={{ fontSize: 11, color: '#4e5370' }}>← drag this to your bookmarks bar</span>
          </div>
        </div>

        {/* How to use */}
        <div style={{ padding: 20, borderRadius: 12, background: '#151929', border: '1px solid #1c2035' }}>
          <div style={{ fontSize: 10, color: '#4e5370', fontFamily: "'JetBrains Mono',monospace", textTransform: 'uppercase' as const, letterSpacing: '.1em', marginBottom: 12 }}>How to install</div>
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 10 }}>
            {[
              'Make sure your bookmarks bar is visible (Cmd+Shift+B in Chrome)',
              'Drag the green or purple button above to your bookmarks bar',
              'Navigate to any webpage you want to capture',
              'Click the bookmarklet — done',
            ].map((step, i) => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#00e5a0', fontFamily: "'JetBrains Mono',monospace", flexShrink: 0 }}>{i + 1}.</span>
                <span style={{ fontSize: 13, color: '#8b90a8', lineHeight: 1.5 }}>{step}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 24, padding: 14, borderRadius: 10, background: 'rgba(245,166,35,.06)', border: '1px solid rgba(245,166,35,.15)' }}>
          <p style={{ fontSize: 12, color: '#f5a623', lineHeight: 1.5 }}>
            Currently points to <span style={{ fontFamily: "'JetBrains Mono',monospace" }}>{origin}</span>. After deploying to Vercel, revisit this page to get updated bookmarklets.
          </p>
        </div>
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
