// ─────────────────────────────────────────────────────────────
// CollectorHub — shared UI primitives (BRD-aligned)
// Reads tokens from colors_and_type.css. Globals at bottom.
// ─────────────────────────────────────────────────────────────

function Ico({ d, size = 20, stroke = 1.75, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" {...rest}>{d}</svg>
  );
}

const Icons = {
  home:    <path d="M3 9 12 2l9 7v11a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z"/>,
  bag:     <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></>,
  users:   <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m22 11-3 3-2-2"/></>,
  user:    <><circle cx="12" cy="8" r="5"/><path d="M3 21a9 9 0 0 1 18 0"/></>,
  search:  <><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></>,
  bell:    <><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>,
  mail:    <><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></>,
  plus:    <><path d="M12 5v14"/><path d="M5 12h14"/></>,
  edit:    <><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></>,
  heart:   <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
  comment: <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z"/>,
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>,
  share:   <><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98"/><path d="m15.41 6.51-6.82 3.98"/></>,
  bookmark:<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>,
  more:    <><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>,
  back:    <path d="m15 18-6-6 6-6"/>,
  close:   <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
  star:    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>,
  shield:  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>,
  filter:  <path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>,
  pin:     <><path d="M12 22s-8-7.58-8-13a8 8 0 0 1 16 0c0 5.42-8 13-8 13z"/><circle cx="12" cy="9" r="3"/></>,
  calendar:<><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
  clock:   <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
  trend:   <><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></>,
  camera:  <><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3z"/><circle cx="12" cy="13" r="4"/></>,
  scan:    <><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 12h10"/></>,
  send:    <><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></>,
  check:   <path d="m5 12 5 5L20 7"/>,
  tag:     <><path d="M20.59 13.41 13.42 20.6a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.2" fill="currentColor"/></>,
  swap:    <><path d="M7 16V4M7 4 3 8M7 4l4 4"/><path d="M17 8v12M17 20l4-4M17 20l-4-4"/></>,
  box:     <><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></>,
  gallery: <><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></>,
  settings:<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-2.81 1.17V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 8 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 3.6 14H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 3.6V3a2 2 0 0 1 4 0v.09A1.65 1.65 0 0 0 16 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 20.4 9H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
  globe:   <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"/></>,
  plusCircle: <><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></>,
  userPlus: <><path d="M14 19a6 6 0 0 0-12 0"/><circle cx="8" cy="8" r="4"/><path d="M17 9v6M20 12h-6"/></>,
  chart:   <><path d="M3 3v18h18"/><rect x="7" y="11" width="3" height="6" rx="1"/><rect x="12" y="7" width="3" height="10" rx="1"/><rect x="17" y="13" width="3" height="4" rx="1"/></>,
  grid:    <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
  eye:     <><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></>,
  eyeOff:  <><path d="M9.9 4.2A9.7 9.7 0 0 1 12 4c6.5 0 10 7 10 7a16 16 0 0 1-3 3.6M6.2 6.2A16 16 0 0 0 2 11s3.5 7 10 7a9.7 9.7 0 0 0 3.4-.6"/><path d="m3 3 18 18M9.5 9.6a3 3 0 0 0 4.2 4.2"/></>,
  ticket:  <><path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2v0a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2 2 2 0 0 0 0-4z"/><path d="M13 6v12" strokeDasharray="2 2"/></>,
  info:    <><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></>,
};

// palette helper for avatars
const AVATAR_PALETTE = ['var(--stamp-red)', 'var(--plum)', 'var(--verified-teal)', 'var(--forest)', 'var(--grail-gold)', 'var(--ink-mute)'];

function Avatar({ name = '?', color, size = 36, verified = false }) {
  const initial = (name || '?').slice(0, 1).toUpperCase();
  const bg = color ?? AVATAR_PALETTE[(name || 'x').charCodeAt(0) % AVATAR_PALETTE.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: bg,
      color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.4,
      position: 'relative', flexShrink: 0, letterSpacing: '-0.02em',
    }}>
      {initial}
      {verified && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: size * 0.42, height: size * 0.42, borderRadius: '50%',
          background: 'var(--verified-teal)', color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--paper)',
        }}>
          <Ico d={Icons.check} size={size * 0.22} stroke={3.5} />
        </div>
      )}
    </div>
  );
}

function Tag({ kind = 'default', children, style }) {
  const styles = {
    sale:   { background: 'var(--stamp-red)', color: 'var(--paper)' },
    po:     { background: 'var(--grail-gold)', color: 'var(--ink)' },
    misb:   { background: 'var(--ink)', color: 'var(--paper)' },
    sold:   { background: 'var(--forest)', color: 'var(--paper)' },
    reserved:{ background: 'var(--grail-gold-soft)', color: 'var(--grail-gold-deep)', border: '1px solid var(--grail-gold)' },
    vouch:  { background: 'var(--verified-teal-soft)', color: 'var(--verified-teal)', border: '1px solid var(--verified-teal)' },
    event:  { background: 'var(--plum-soft)', color: 'var(--plum)', border: '1px solid var(--plum)' },
    default:{ background: 'var(--bone)', color: 'var(--ink)' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 7px', borderRadius: 4, lineHeight: 1,
      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 10,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      ...styles[kind], ...style,
    }}>{children}</span>
  );
}

// Post-type pill (Showcase / Discussion / Review) — BRD §8.5
function PostTypeTag({ type }) {
  const map = {
    showcase:   { label: 'Showcase',   c: 'var(--verified-teal)' },
    discussion: { label: 'Discussion', c: 'var(--plum)' },
    review:     { label: 'Review',     c: 'var(--grail-gold-deep)' },
  };
  const m = map[type] || map.showcase;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 10,
      letterSpacing: '0.08em', textTransform: 'uppercase', color: m.c,
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: m.c }}/>{m.label}
    </span>
  );
}

// Ownership-verification badge — BRD §8.3 (Claimed / Shown / Verified)
function VerifyBadge({ tier = 'claimed', size = 'sm' }) {
  const map = {
    verified: { label: 'Verified', c: 'var(--verified-teal)', bg: 'var(--verified-teal-soft)', icon: Icons.shield },
    shown:    { label: 'Shown',    c: 'var(--grail-gold-deep)', bg: 'var(--grail-gold-soft)', icon: Icons.camera },
    claimed:  { label: 'Claimed',  c: 'var(--ink-faint)', bg: 'var(--bone)', icon: Icons.box },
  };
  const m = map[tier] || map.claimed;
  const pad = size === 'lg' ? '5px 9px' : '3px 6px';
  const fs = size === 'lg' ? 11 : 10;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: pad, borderRadius: 5, background: m.bg, color: m.c,
      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: fs,
      letterSpacing: '0.04em', lineHeight: 1, whiteSpace: 'nowrap',
    }}>
      <Ico d={m.icon} size={fs + 2} stroke={2}/>{m.label}
    </span>
  );
}

// Trust tier chip (Top Seller / Trusted / Verified) — BRD §8.2
function TierChip({ tier }) {
  const map = {
    'Top Seller': 'var(--stamp-red)',
    'Trusted':    'var(--forest)',
  };
  const c = map[tier];
  if (!c) return null;  // base users (incl. former "Verified") show no chip
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 999, border: `1px solid ${c}`,
      color: c, background: 'transparent',
      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 10.5,
      letterSpacing: '0.04em', lineHeight: 1, whiteSpace: 'nowrap',
    }}>
      <Ico d={Icons.shield} size={11} stroke={2.2}/>{tier}
    </span>
  );
}

// Transaction-linked trust signals row — BRD §8.2 PR-05
function TrustSignals({ u, compact = false }) {
  const items = [
    { v: u.deals, l: 'deals' },
    { v: u.rating + '★', l: `${u.ratingCount} ratings` },
    { v: u.response, l: 'replies' },
    { v: u.joined, l: 'joined' },
  ];
  return (
    <div style={{ display: 'flex', gap: compact ? 14 : 0, justifyContent: compact ? 'flex-start' : 'space-between' }}>
      {items.map((it, i) => (
        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: compact ? 'auto' : 0 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 14, color: 'var(--ink)', fontFeatureSettings: '"tnum" 1' }}>{it.v}</span>
          <span style={{ fontSize: 10.5, color: 'var(--ink-faint)', letterSpacing: '0.02em' }}>{it.l}</span>
        </div>
      ))}
    </div>
  );
}

function Stars({ n = 0, size = 13, c = 'var(--grail-gold-deep)' }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1, color: c }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= n ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.6}>
          <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>
        </svg>
      ))}
    </span>
  );
}

function Button({ variant = 'primary', size = 'md', icon, children, onClick, style, disabled }) {
  const variants = {
    primary:   { background: 'var(--stamp-red)', color: 'var(--paper)', border: '1px solid var(--stamp-red)' },
    secondary: { background: 'var(--paper-soft)', color: 'var(--ink)', border: '1px solid var(--border-strong)' },
    ghost:     { background: 'transparent', color: 'var(--ink)', border: '1px solid transparent' },
    dark:      { background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)' },
    teal:      { background: 'var(--verified-teal)', color: 'var(--paper)', border: '1px solid var(--verified-teal)' },
    grail:     { background: 'var(--grail-gold)', color: 'var(--ink)', border: '1px solid var(--grail-gold-deep)', boxShadow: 'var(--shadow-stamp)' },
  };
  const sizes = {
    sm:  { height: 32, padding: '0 12px', fontSize: 13, borderRadius: 8 },
    md:  { height: 44, padding: '0 18px', fontSize: 15, borderRadius: 12 },
    lg:  { height: 52, padding: '0 22px', fontSize: 16, borderRadius: 14 },
    block:{ height: 50, padding: '0 20px', fontSize: 16, borderRadius: 13, width: '100%', justifyContent: 'center' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontFamily: 'var(--font-body)', fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
      transition: 'transform 120ms var(--ease-out), background 120ms',
      lineHeight: 1, whiteSpace: 'nowrap', ...variants[variant], ...sizes[size], ...style,
    }}
      onPointerDown={(e) => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onPointerUp={(e) => e.currentTarget.style.transform = ''}
      onPointerLeave={(e) => e.currentTarget.style.transform = ''}>
      {icon}{children}
    </button>
  );
}

function IconButton({ icon, onClick, active, badge }) {
  return (
    <button onClick={onClick} style={{
      width: 38, height: 38, borderRadius: 11, position: 'relative',
      background: active ? 'var(--ink)' : 'transparent',
      color: active ? 'var(--paper)' : 'var(--ink)',
      border: '1px solid ' + (active ? 'var(--ink)' : 'var(--border)'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0,
    }}>
      {icon}
      {badge ? (
        <span style={{
          position: 'absolute', top: -3, right: -3, minWidth: 16, height: 16, padding: '0 4px',
          borderRadius: 999, background: 'var(--stamp-red)', color: 'var(--paper)',
          fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid var(--paper)',
        }}>{badge}</span>
      ) : null}
    </button>
  );
}

function CategoryChip({ active, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 14px', borderRadius: 999,
      background: active ? 'var(--ink)' : 'var(--paper-soft)',
      color: active ? 'var(--paper)' : 'var(--ink)',
      border: `1px solid ${active ? 'var(--ink)' : 'var(--border-strong)'}`,
      fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13,
      cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1, flexShrink: 0,
    }}>{children}</button>
  );
}

// Segmented control (sort tabs, profile tabs) — paper inset
function Segmented({ options, value, onChange, style }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--bone)', borderRadius: 10, padding: 3, gap: 2, ...style,
    }}>
      {options.map(o => {
        const active = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            flex: 1, padding: '7px 6px', borderRadius: 8, border: 'none',
            background: active ? 'var(--paper)' : 'transparent',
            color: active ? 'var(--ink)' : 'var(--ink-faint)',
            fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 500, fontSize: 13,
            cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1,
            boxShadow: active ? 'var(--shadow-1)' : 'none', transition: 'all 120ms',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function Stamp({ children, color = 'var(--stamp-red)', rotate = 2, style }) {
  return (
    <span style={{
      background: color, color: 'var(--paper)', padding: '4px 8px', borderRadius: 4,
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11,
      letterSpacing: '0.10em', textTransform: 'uppercase', boxShadow: 'var(--shadow-stamp)',
      transform: `rotate(${rotate}deg)`, lineHeight: 1, whiteSpace: 'nowrap', display: 'inline-block', ...style,
    }}>{children}</span>
  );
}

// Product / item photo placeholder (no real photos) — figure silhouette over tone gradient
function ProductPhoto({ tone = 'red', label, ratio = '4/3', rounded = 10, style, children }) {
  const tones = {
    red:    'linear-gradient(135deg, #B73B2E 0%, #842A24 100%)',
    gold:   'linear-gradient(135deg, #E8A33D 0%, #B07724 100%)',
    teal:   'linear-gradient(135deg, #3FA39B 0%, #1F6E68 100%)',
    plum:   'linear-gradient(135deg, #8B4870 0%, #4E2640 100%)',
    forest: 'linear-gradient(135deg, #4A8E5F 0%, #234A30 100%)',
    ink:    'linear-gradient(135deg, #3A332E 0%, #14110F 100%)',
    bone:   'linear-gradient(135deg, #D6CDB9 0%, #B8AFA3 100%)',
  };
  return (
    <div style={{
      aspectRatio: ratio, width: '100%', background: tones[tone] || tones.red,
      borderRadius: rounded, position: 'relative', overflow: 'hidden', ...style,
    }}>
      <div style={{ position: 'absolute', inset: 0,
        backgroundImage: 'radial-gradient(circle at 30% 28%, rgba(255,255,255,0.2), transparent 60%)', mixBlendMode: 'soft-light' }} />
      <svg viewBox="0 0 120 90" preserveAspectRatio="xMidYMax meet"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }}>
        <ellipse cx="60" cy="84" rx="22" ry="3" fill="rgba(0,0,0,0.5)"/>
        <path d="M60 22 q6 0 7 6 t-2 12 q4 4 4 14 l3 18 q1 8 -4 10 l-2 2 -3 -2 q-1 -8 -2 -14 l0 14 -3 4 -3 -4 0 -14 q-1 6 -2 14 l-3 2 -2 -2 q-5 -2 -4 -10 l3 -18 q0 -10 4 -14 q-3 -6 -2 -12 t7 -6 z"
          fill="rgba(0,0,0,0.55)"/>
      </svg>
      {label && (
        <div style={{ position: 'absolute', bottom: 8, left: 10, color: 'rgba(244,239,230,0.72)',
          fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.05em' }}>{label}</div>
      )}
      {children}
    </div>
  );
}

// Deterministic pseudo-QR ticket graphic (squares only) — BRD v1.2 §9.13
function QRCode({ seed = 'ch', size = 140, fg = 'var(--ink)', bg = 'var(--paper)' }) {
  const N = 21;
  // simple deterministic hash -> bit per cell
  const cells = React.useMemo(() => {
    let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
    const out = [];
    for (let i = 0; i < N * N; i++) { h = (h * 1103515245 + 12345) >>> 0; out.push((h >> 16) & 1); }
    return out;
  }, [seed]);
  const isFinder = (r, c) => {
    const inBox = (br, bc) => r >= br && r < br + 7 && c >= bc && c < bc + 7;
    return inBox(0, 0) || inBox(0, N - 7) || inBox(N - 7, 0);
  };
  const finderOn = (r, c) => {
    const local = (br, bc) => { const rr = r - br, cc = c - bc; const edge = rr === 0 || rr === 6 || cc === 0 || cc === 6; const core = rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4; return edge || core; };
    if (r < 7 && c < 7) return local(0, 0);
    if (r < 7 && c >= N - 7) return local(0, N - 7);
    if (r >= N - 7 && c < 7) return local(N - 7, 0);
    return false;
  };
  const cell = size / N;
  return (
    <div style={{ width: size, height: size, background: bg, borderRadius: 8, position: 'relative' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} shapeRendering="crispEdges">
        {Array.from({ length: N * N }).map((_, idx) => {
          const r = Math.floor(idx / N), c = idx % N;
          const on = isFinder(r, c) ? finderOn(r, c) : cells[idx] === 1;
          if (!on) return null;
          return <rect key={idx} x={c * cell} y={r * cell} width={cell} height={cell} fill={fg}/>;
        })}
      </svg>
    </div>
  );
}

function Divider({ dashed = false, my = 12 }) {
  return <hr style={{ border: 'none', borderTop: `1px ${dashed ? 'dashed' : 'solid'} var(--border)`, margin: `${my}px 0` }}/>;
}

function Money({ value, currency = '₹', strike = false, size }) {
  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontFeatureSettings: '"tnum" 1', fontWeight: 600,
      textDecoration: strike ? 'line-through' : 'none',
      color: strike ? 'var(--ink-faint)' : 'inherit', fontSize: size,
    }}>{currency} {value.toLocaleString('en-IN')}</span>
  );
}

// Quick-action button used under feed cards
function ActionBtn({ icon, label, active, activeColor = 'var(--stamp-red)', onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
      padding: '4px 2px', cursor: 'pointer', color: active ? activeColor : 'var(--ink-mute)',
      fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 500,
    }}>
      <span style={{ display: 'flex' }}>{React.cloneElement(icon, { fill: active ? activeColor : 'none' })}</span>
      {label != null && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{label}</span>}
    </button>
  );
}

Object.assign(window, {
  Ico, Icons, Avatar, Tag, PostTypeTag, VerifyBadge, TierChip, TrustSignals, Stars,
  Button, IconButton, CategoryChip, Segmented, Stamp, ProductPhoto, Divider, Money, ActionBtn, QRCode,
});
