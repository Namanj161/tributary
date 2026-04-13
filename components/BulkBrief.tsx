'use client';

import { BulkBrief } from '@/types';

export default function BulkBriefView({ data }: { data: BulkBrief }) {
  const { results, connections_found, stats } = data;

  return (
    <div>
      <div style={{
        padding: 24, borderRadius: 14, marginBottom: 16,
        background: '#10131e', border: '1px solid #1c2035',
        position: 'relative' as const, overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute' as const, top: 0, left: 0, right: 0, height: 2,
          background: 'linear-gradient(90deg, #6c5ce7, #00e5a0, transparent)',
        }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#6c5ce7',
            textTransform: 'uppercase' as const, letterSpacing: '0.12em',
            fontFamily: "'JetBrains Mono', monospace",
          }}>Bulk Import Complete</span>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#6c5ce7' }} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Syne', sans-serif", lineHeight: 1.3 }}>
          {stats.sources_processed} sources processed
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 32 }}>
        {[
          { value: stats.units_added, label: 'Units added', color: '#00e5a0' },
          { value: connections_found, label: 'Connections', color: '#f5a623' },
          { value: stats.total_units, label: 'Total units', color: '#6c5ce7' },
          { value: stats.total_connections, label: 'Total connections', color: '#2dd4bf' },
        ].map((s) => (
          <div key={s.label} style={{
            padding: 16, borderRadius: 12, textAlign: 'center' as const,
            background: '#151929', border: '1px solid #1c2035',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color, fontFamily: "'Syne', sans-serif" }}>{s.value}</div>
            <div style={{ fontSize: 10, color: '#4e5370', fontFamily: "'JetBrains Mono', monospace", marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '4px 12px', borderRadius: 6,
          background: 'rgba(0,229,160,0.1)', color: '#00e5a0',
          border: '1px solid rgba(0,229,160,0.2)',
          fontFamily: "'JetBrains Mono', monospace",
        }}>SOURCE RESULTS</span>
        <div style={{ flex: 1, height: 1, background: '#1c2035' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 8 }}>
        {results.map((result, i) => (
          <div key={i} style={{
            padding: 16, borderRadius: 12,
            background: '#151929', border: '1px solid #1c2035',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
              background: result.status === 'success' ? '#00e5a0' : '#ff6b6b',
            }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                fontSize: 14, fontWeight: 600, color: '#e8eaf0',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const,
              }}>
                {result.title || result.input}
              </p>
              {result.error && (
                <p style={{ fontSize: 12, color: '#ff6b6b', marginTop: 4 }}>{result.error}</p>
              )}
            </div>
            {result.status === 'success' && (
              <span style={{
                fontSize: 12, color: '#00e5a0', fontWeight: 700, flexShrink: 0,
                fontFamily: "'JetBrains Mono', monospace",
              }}>+{result.units_added} units</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
