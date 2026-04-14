'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const TPIC_VERSION = 'v1.7';

const LINKS: { href: string; label: string; color: string; bg: string }[] = [
  { href: '/',          label: 'Intake',         color: '#00e5a0', bg: 'rgba(0,229,160,.1)' },
  { href: '/knowledge', label: 'Knowledge Base', color: '#00e5a0', bg: 'rgba(0,229,160,.1)' },
  { href: '/graph',     label: 'Graph',          color: '#00e5a0', bg: 'rgba(0,229,160,.1)' },
  { href: '/query',     label: 'Query',          color: '#6c5ce7', bg: 'rgba(108,92,231,.1)' },
  { href: '/wiki',      label: 'Wiki',           color: '#2dd4bf', bg: 'rgba(45,212,191,.1)' },
  { href: '/profile',   label: 'Profile',        color: '#f5a623', bg: 'rgba(245,166,35,.1)' },
  { href: '/actions',   label: 'Actions',        color: '#ff6b6b', bg: 'rgba(255,107,107,.1)' },
  { href: '/setup',     label: 'Capture',        color: '#60a5fa', bg: 'rgba(96,165,250,.1)' },
];

export default function Nav({ maxWidth = 1100 }: { maxWidth?: number }) {
  const pathname = usePathname() || '/';

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  };

  return (
    <header
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        background: 'rgba(6,7,11,.85)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid #1c2035',
      }}
    >
      <div
        style={{
          maxWidth, margin: '0 auto', padding: '0 24px', height: 56,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
        }}
      >
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
        >
          <div
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg,#00e5a0,#6c5ce7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 800, color: '#06070b',
              fontFamily: "'Syne',sans-serif",
            }}
          >
            T
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, fontFamily: "'Syne',sans-serif", letterSpacing: '.02em' }}>
            TPIC
          </span>
          <span
            style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 4,
              background: '#1e2340', color: '#4e5370',
              fontFamily: "'JetBrains Mono',monospace",
            }}
          >
            {TPIC_VERSION}
          </span>
        </Link>

        <nav style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {LINKS.map((l) => {
            const active = isActive(l.href);
            if (active) {
              return (
                <span
                  key={l.href}
                  style={{
                    padding: '6px 14px', borderRadius: 8, fontSize: 13,
                    fontWeight: 600, color: l.color, background: l.bg,
                  }}
                >
                  {l.label}
                </span>
              );
            }
            return (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: '6px 14px', borderRadius: 8, fontSize: 13,
                  color: '#8b90a8', textDecoration: 'none',
                }}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
