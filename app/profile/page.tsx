'use client';
import { useState, useEffect } from 'react';
import Nav from '@/components/Nav';

export default function ProfilePage() {
  const [profile, setProfile] = useState({ role:'', company:'', projects:'', goals:'', challenges:'', raw_context:'' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch('/api/profile').then(r => r.json()).then(d => {
      setProfile({ role: d.role||'', company: d.company||'', projects: d.projects||'', goals: d.goals||'', challenges: d.challenges||'', raw_context: d.raw_context||'' });
      setLoading(false);
    });
  }, []);

  async function handleSave() {
    setSaving(true); setSaved(false);
    await fetch('/api/profile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(profile) });
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const fields = [
    { key: 'role', label: 'What do you do?', placeholder: 'e.g., I run content and influencer marketing for AI/tech brands at SoCap', rows: 2 },
    { key: 'company', label: 'Company / Work context', placeholder: 'e.g., Social Capital Inc — we do influencer launches for AI startups, manage 200+ creators across Twitter and LinkedIn', rows: 2 },
    { key: 'projects', label: 'What are you actively working on right now?', placeholder: 'e.g., Launching Wispr Flow campaign next week, building QRT writing SOP for new writers, growing LinkedIn influencer database', rows: 3 },
    { key: 'goals', label: 'What are you trying to achieve?', placeholder: 'e.g., Scale SoCap to handle 5 simultaneous launches, build repeatable viral launch playbook, grow personal brand on X', rows: 3 },
    { key: 'challenges', label: 'What\'s hard right now?', placeholder: 'e.g., Finding influencers who actually drive conversions not just impressions, maintaining content quality at scale, pricing launches correctly', rows: 3 },
    { key: 'raw_context', label: 'Anything else TPIC should know about you', placeholder: 'e.g., I think in systems and frameworks. I care about first-principles over best practices. I\'m building multiple projects simultaneously — TPIC, CapitalScope, Structural Edge. I read Acharya Prashant.', rows: 3 },
  ];

  return (
    <div style={{ minHeight: '100vh', background: '#06070b', fontFamily: "'DM Sans',sans-serif", color: '#e8eaf0' }}>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 30% 50%, rgba(245,166,35,0.04) 0%, transparent 50%)', pointerEvents: 'none' }} />
      <Nav />

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '100px 24px 80px' }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: 32, fontWeight: 800, marginBottom: 10 }}>
            Tell TPIC <span style={{ color: '#f5a623' }}>who you are.</span>
          </h1>
          <p style={{ fontSize: 14, color: '#8b90a8', lineHeight: 1.6 }}>
            This context shapes everything — how relevance is scored, what actions are suggested, and which connections matter most. Be specific. The more TPIC knows, the sharper its lens.
          </p>
        </div>

        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' as const, color: '#4e5370' }}>Loading profile...</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 20 }}>
            {fields.map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#e8eaf0', marginBottom: 8 }}>{f.label}</label>
                <textarea
                  value={(profile as any)[f.key]}
                  onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  rows={f.rows}
                  style={{
                    width: '100%', padding: 16, fontSize: 14, resize: 'vertical',
                    outline: 'none', background: '#10131e', color: '#e8eaf0',
                    border: '1px solid #1c2035', borderRadius: 12,
                    fontFamily: "'DM Sans',sans-serif", lineHeight: 1.6,
                    transition: 'border-color .2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#f5a623'}
                  onBlur={e => e.target.style.borderColor = '#1c2035'}
                />
              </div>
            ))}

            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8 }}>
              <button onClick={handleSave} disabled={saving} style={{
                padding: '12px 32px', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                fontFamily: "'Syne',sans-serif", letterSpacing: '.02em',
                background: saving ? '#1e2340' : 'linear-gradient(135deg,#f5a623,#e8941a)',
                color: saving ? '#4e5370' : '#06070b', transition: 'all .2s',
              }}>{saving ? 'Saving...' : 'Save Profile'}</button>
              {saved && <span style={{ fontSize: 13, color: '#00e5a0', fontFamily: "'JetBrains Mono',monospace" }}>✓ Saved</span>}
            </div>
          </div>
        )}
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
        textarea::placeholder{color:#3a3f5a;}
        *{box-sizing:border-box;margin:0;padding:0;}
        ::-webkit-scrollbar{width:5px;}
        ::-webkit-scrollbar-thumb{background:#2a3050;border-radius:3px;}
      `}</style>
    </div>
  );
}
