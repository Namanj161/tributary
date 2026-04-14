export default function Loading() {
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
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', gap: 3 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 24 + i * 6,
              borderRadius: 2,
              background: '#00e5a0',
              opacity: 0.3 + i * 0.15,
              animation: `tpic-pulse 1s ease-in-out ${i * 0.15}s infinite`,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color: '#4e5370', fontFamily: "'JetBrains Mono', monospace" }}>loading…</span>
      <style>{`@keyframes tpic-pulse{0%,100%{opacity:.3}50%{opacity:.8}}@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');`}</style>
    </div>
  );
}
