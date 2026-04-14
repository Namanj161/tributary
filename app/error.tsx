'use client';
import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#06070b',
        color: '#e8eaf0',
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          padding: 32,
          borderRadius: 16,
          background: '#10131e',
          border: '1px solid #1c2035',
          textAlign: 'center' as const,
        }}
      >
        <div
          style={{
            width: 48, height: 48, borderRadius: 12, margin: '0 auto 20px',
            background: 'rgba(255,107,107,.08)',
            border: '1px solid rgba(255,107,107,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22,
          }}
        >
          ⚠
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, fontFamily: "'Syne', sans-serif", marginBottom: 8 }}>
          Something broke.
        </h1>
        <p style={{ fontSize: 14, color: '#8b90a8', lineHeight: 1.6, marginBottom: 20 }}>
          TPIC hit an unexpected error. This has been logged.
        </p>
        {error?.message && (
          <div
            style={{
              padding: 12, borderRadius: 8, marginBottom: 20, textAlign: 'left' as const,
              background: 'rgba(255,107,107,.05)', border: '1px solid rgba(255,107,107,.12)',
              fontSize: 12, color: '#ff6b6b', fontFamily: "'JetBrains Mono', monospace",
              whiteSpace: 'pre-wrap' as const, wordBreak: 'break-word' as const,
            }}
          >
            {error.message}
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button
            onClick={() => reset()}
            style={{
              padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: 'none', cursor: 'pointer', fontFamily: "'Syne', sans-serif",
              background: 'linear-gradient(135deg,#00e5a0,#00b880)', color: '#06070b',
            }}
          >
            Try again
          </button>
          <Link
            href="/"
            style={{
              padding: '10px 24px', borderRadius: 10, fontSize: 13, fontWeight: 700,
              border: '1px solid #1c2035', textDecoration: 'none', fontFamily: "'Syne', sans-serif",
              background: 'transparent', color: '#8b90a8',
            }}
          >
            Back to Intake
          </Link>
        </div>
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');*{box-sizing:border-box;margin:0;padding:0;}`}</style>
    </div>
  );
}
