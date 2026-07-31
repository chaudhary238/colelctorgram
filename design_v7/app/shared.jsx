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
  chevR:   <path d="m9 18 6-6-6-6"/>,
  close:   <><path d="M18 6 6 18"/><path d="m6 6 12 12"/></>,
  star:    <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>,
  shield:  <><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/></>,
  filter:  <path d="M22 3H2l8 9.46V19l4 2v-8.54z"/>,
  sliders: <><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/><circle cx="10" cy="6" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="10" cy="18" r="2"/></>,
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
  zap:     <path d="M13 2 3 14h7l-1 8 10-12h-7z"/>,
  trophy:  <><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></>,
  award:   <><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></>,
  gift:    <><rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M20 12v9H4v-9"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5"/></>,
  lock:    <><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>,
  sparkle: <path d="M12 2.5 14 9l6.5 2-6.5 2-2 6.5-2-6.5L3.5 11 10 9z"/>,
  gem:     <><path d="M6 3h12l4 6-10 12L2 9z"/><path d="M2 9h20M9 3 6 9l6 12 6-12-3-6M12 3l-3 6h6z"/></>,
  flame:   <path d="M12 2c1.5 3.5 5 5.5 5 9.5a5 5 0 0 1-10 0c0-1.6.6-2.8 1.4-3.8.3 1 1 1.8 1.9 2C9.5 7.5 10.5 4.5 12 2z"/>,
  crown:   <><path d="M3 7l4 4 5-7 5 7 4-4-1.5 12.5h-15z"/><path d="M4.5 21h15"/></>,
  medal:   <><circle cx="12" cy="14" r="6"/><path d="M8.5 8.5 6 2H9l2 4M15.5 8.5 18 2h-3l-2 4"/><path d="M12 11.5l1 2 2 .3-1.5 1.5.4 2-1.9-1-1.9 1 .4-2L9 13.8l2-.3z"/></>,
  rocket:  <><path d="M5 13c-2 1.5-2 5-2 5s3.5 0 5-2"/><path d="M9 15c-1-1-1.5-3 0-6 2-4 5-6 11-6 0 6-2 9-6 11-3 1.5-5 1-5 1z"/><circle cx="14.5" cy="9.5" r="1.5"/></>,
  logout:  <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>,
  phone:   <path d="M22 16.9v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.07 12.1a19.8 19.8 0 0 1-3.07-8.67A2 2 0 0 1 3 1.36h3a2 2 0 0 1 2 1.72 12.8 12.8 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9a16 16 0 0 0 5.91 5.91l1.27-1.27a2 2 0 0 1 2.11-.45 12.8 12.8 0 0 0 2.81.7A2 2 0 0 1 21 16l.9.9z"/>,
  doc:     <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></>,
  flag:    <><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></>,
  trash:   <><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>,
  community: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></>,
  chevRight: <path d="m9 18 6-6-6-6"/>,
  mapPin:    <><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></>,
  compass:   <><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/></>,
  handshake: <><path d="m11 17 2 2a1 1 0 1 0 3-3"/><path d="m14 14 2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="m21 3 1 11h-1"/><path d="M3 3 2 14l6.5 6.5a1 1 0 1 0 3-3"/><path d="M3 4h8"/></>,
  package:   <><path d="m16.5 9.4-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  layers:    <><path d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z"/><path d="m22 12.5-8.97 4.08a2 2 0 0 1-1.66 0L2 12.5"/><path d="m22 17.5-8.97 4.08a2 2 0 0 1-1.66 0L2 17.5"/></>,
  verified:  <><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></>,
  list:      <path d="M3 12h.01M3 6h.01M3 18h.01M8 12h13M8 6h13M8 18h13"/>,
  store:     <><path d="M3 9a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a1 1 0 0 0-.6-.92l-8-3.5a1 1 0 0 0-.8 0l-8 3.5A1 1 0 0 0 3 6z"/><path d="M3 10v10a1 1 0 0 0 1 1h6v-4h4v4h6a1 1 0 0 0 1-1V10"/></>,
};

// palette helper for avatars
const AVATAR_PALETTE = ['var(--stamp-red)', 'var(--plum)', 'var(--verified-teal)', 'var(--forest)', 'var(--grail-gold)', 'var(--ink-mute)'];

function Avatar({ name = '?', color, size = 36, verified = false, photo, frame, framePip }) {
  const initial = (name || '?').slice(0, 1).toUpperCase();
  const bg = color ?? AVATAR_PALETTE[(name || 'x').charCodeAt(0) % AVATAR_PALETTE.length];
  // frame: 'gold' → gold ring for First Start badge holders
  const frameWidth = frame ? Math.max(2, Math.round(size * 0.055)) : 0;
  const pipSize = frame ? Math.round(size * 0.32) : 0;
  return (
    <div style={{ position: 'relative', flexShrink: 0, width: size, height: size }}>
      <div style={{
        width: size, height: size, borderRadius: '50%', background: bg,
        color: 'var(--paper)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.4,
        letterSpacing: '-0.02em', overflow: 'hidden',
        backgroundImage: photo ? `url(${photo})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center',
        boxSizing: 'border-box',
        ...(frame === 'gold' ? {
          border: `${frameWidth}px solid #E8A33D`,
          boxShadow: `0 0 0 ${frameWidth}px #FEF3C7, 0 0 0 ${frameWidth * 2}px #E8A33D`,
        } : {}),
      }}>
        {!photo && initial}
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
    </div>
  );
}

// Returns 'gold' frame string if user holds a First Start badge, else undefined
function avatarFrame(u) {
  if (!u) return undefined;
  try {
    const b = feedBadge(u);
    return (b && b.type === 'firstStart') ? 'gold' : undefined;
  } catch(e) { return undefined; }
}
// Returns the pip emoji for the frame (badge-specific)
function avatarFramePip(u) {
  if (!u) return '⭐';
  try {
    const b = feedBadge(u);
    return (b && b.emoji) ? b.emoji : '⭐';
  } catch(e) { return '⭐'; }
}

function Tag({ kind = 'default', children, style }) {
  const styles = {
    sale:   { background: 'var(--stamp-red)', color: 'var(--paper)' },
    po:     { background: 'var(--grail-gold)', color: 'var(--ink)' },
    misb:   { background: 'var(--ink)', color: 'var(--paper)' },
    sold:   { background: 'var(--forest)', color: 'var(--paper)' },
    reserved:{ background: 'var(--grail-gold-soft)', color: 'var(--grail-gold-deep)', border: '1px solid var(--grail-gold)' },
    intel:  { background: 'var(--verified-teal-soft)', color: 'var(--verified-teal)', border: '1px solid var(--verified-teal)' },
    teal:   { background: 'var(--verified-teal-soft)', color: 'var(--verified-teal)', border: '1px solid var(--verified-teal)' },
    vouch:  { background: 'var(--verified-teal-soft)', color: 'var(--verified-teal)', border: '1px solid var(--verified-teal)' },
    event:  { background: 'var(--plum-soft)', color: 'var(--plum)', border: '1px solid var(--plum)' },
    default:{ background: 'var(--bone)', color: 'var(--ink)' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 8px', borderRadius: 6, lineHeight: 1,
      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 10,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      ...styles[kind], ...style,
    }}>{children}</span>
  );
}

// Post-type pill (Showcase / Discussion / Review) — BRD §8.5
function PostTypeTag({ type }) {
  const map = {
    post:       { label: 'Post',       c: '#999999',  bg: 'rgba(0,0,0,0.06)' },
    showcase:   { label: 'Showcase',   c: '#2D8F87',  bg: 'rgba(45,143,135,0.12)' },
    discussion: { label: 'Discussion', c: '#6B3656',  bg: 'rgba(107,54,86,0.12)' },
    review:     { label: 'Review',     c: '#C48420',  bg: 'rgba(196,132,32,0.12)' },
    poll:       { label: 'Poll',       c: '#FF2442',  bg: 'rgba(255,36,66,0.10)' },
    iso:        { label: 'ISO',        c: '#B07724',  bg: 'rgba(176,119,36,0.13)' },
  };
  const m = map[type] || map.post;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 8px', borderRadius: 6,
      background: m.bg, color: m.c,
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10,
      letterSpacing: '0.07em', textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
    }}>{m.label}</span>
  );
}

// Ownership-verification tiers (Shown / Verified) were removed — no badge renders.
function VerifyBadge() { return null; }

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
      letterSpacing: '0.04em', lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <Ico d={Icons.shield} size={11} stroke={2.2}/>{tier}
    </span>
  );
}

// Status → display label (avoids raw lowercase like "preorder" / "wishlist")
const STATUS_LABEL = { available: 'Available', sold: 'Sold', reserved: 'Reserved', preorder: 'Pre-order', wishlist: 'Intel', intel: 'DB Contribution', owned: 'Owned' };
function statusLabel(s) { return STATUS_LABEL[s] || (s ? s.charAt(0).toUpperCase() + s.slice(1) : ''); }

// Transaction-linked trust signals row — BRD §8.2 PR-05
function TrustSignals({ u, compact = false }) {
  const items = [
    { v: u.deals, l: 'Deals' },
    { v: u.vouchesReceived, l: 'Vouches' },
    { v: u.response, l: 'Replies' },
    { v: u.joined, l: 'Joined' },
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
    primary:     { background: 'var(--stamp-red)', color: 'var(--paper)', border: '1px solid var(--stamp-red)' },
    secondary:   { background: 'var(--bone)', color: 'var(--ink-soft)', border: '1px solid var(--border-strong)' },
    outline:     { background: 'transparent', color: 'var(--ink)', border: '1px solid var(--border-strong)' },
    ghost:       { background: 'transparent', color: 'var(--ink)', border: '1px solid transparent' },
    dark:        { background: 'var(--ink)', color: 'var(--paper)', border: '1px solid var(--ink)' },
    teal:        { background: 'var(--verified-teal)', color: 'var(--paper)', border: '1px solid var(--verified-teal)' },
    grail:       { background: 'var(--grail-gold)', color: 'var(--ink)', border: '1px solid var(--grail-gold-deep)', boxShadow: 'var(--shadow-stamp)' },
    link:        { background: 'transparent', color: 'var(--stamp-red)', border: 'none', textDecoration: 'underline', textUnderlineOffset: '3px' },
    destructive: { background: 'var(--stamp-red-soft)', color: 'var(--stamp-red)', border: '1px solid rgba(255,36,66,0.25)' },
  };
  const sizes = {
    sm:  { height: 34, padding: '0 14px', fontSize: 13, borderRadius: 9 },
    md:  { height: 46, padding: '0 20px', fontSize: 15, borderRadius: 14 },
    lg:  { height: 54, padding: '0 24px', fontSize: 16, borderRadius: 16 },
    block:{ height: 52, padding: '0 22px', fontSize: 16, borderRadius: 14, width: '100%', justifyContent: 'center' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontFamily: 'var(--font-body)', fontWeight: 600,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
      transition: 'transform 120ms var(--ease-out), background 120ms, box-shadow 120ms',
      lineHeight: 1, whiteSpace: 'nowrap', outline: 'none',
      ...variants[variant], ...sizes[size], ...style,
    }}
      onPointerDown={(e) => !disabled && (e.currentTarget.style.transform = 'scale(0.97)')}
      onPointerUp={(e) => e.currentTarget.style.transform = ''}
      onPointerLeave={(e) => e.currentTarget.style.transform = ''}
      onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px var(--ring)'; }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = ''; }}>
      {icon}{children}
    </button>
  );
}

function IconButton({ icon, onClick, active, badge }) {
  return (
    <button onClick={onClick} style={{
      width: 40, height: 40, borderRadius: 13, position: 'relative',
      background: active ? 'var(--ink)' : 'transparent',
      color: active ? 'var(--paper)' : 'var(--ink)',
      border: '1px solid ' + (active ? 'var(--ink)' : 'var(--border)'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', flexShrink: 0, outline: 'none',
      transition: 'background 120ms, border-color 120ms, box-shadow 120ms',
    }}
      onFocus={(e) => { e.currentTarget.style.boxShadow = '0 0 0 3px var(--ring)'; }}
      onBlur={(e) => { e.currentTarget.style.boxShadow = ''; }}>
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
    <button onClick={onClick}
      onPointerDown={e => e.currentTarget.style.transform = 'scale(0.94)'}
      onPointerUp={e => e.currentTarget.style.transform = ''}
      onPointerLeave={e => e.currentTarget.style.transform = ''}
      style={{
        padding: '8px 16px', borderRadius: 999,
        background: active ? 'var(--stamp-red)' : 'var(--paper-soft)',
        color: active ? 'var(--paper)' : 'var(--ink)',
        border: `1px solid ${active ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
        fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 500, fontSize: 13,
        cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1, flexShrink: 0,
        transition: 'all 150ms var(--ease-out), transform 80ms',
      }}>{children}</button>
  );
}

// Segmented control (sort tabs, profile tabs) — paper inset
function Segmented({ options, value, onChange, style }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--bone)', borderRadius: 12, padding: 4, gap: 2, ...style,
    }}>
      {options.map(o => {
        const active = o.id === value;
        return (
          <button key={o.id} onClick={() => onChange(o.id)} style={{
            flex: 1, padding: '8px 6px', borderRadius: 9, border: 'none',
            background: active ? 'var(--paper)' : 'transparent',
            color: active ? 'var(--ink)' : 'var(--ink-faint)',
            fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 500, fontSize: 13,
            cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1,
            boxShadow: active ? 'var(--shadow-2)' : 'none', transition: 'all 120ms',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
}

function Stamp({ children, color = 'var(--stamp-red)', rotate = 2, style }) {
  return (
    <span style={{
      background: color, color: 'var(--paper)', padding: '4px 8px', borderRadius: 6,
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

// Compact count formatter for social stats — 1284 → 1.3K, 3.45M → 3.4M.
// Keeps the number short so the four stat tiles stay uniform at any size.
function compactNum(n) {
  n = n || 0;
  if (n < 1000) return n.toLocaleString('en-IN');
  if (n < 1000000) { const v = n / 1000; return (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)) + 'K'; }
  if (n < 1000000000) { const v = n / 1000000; return (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)) + 'M'; }
  const v = n / 1000000000; return (v < 10 ? v.toFixed(1).replace(/\.0$/, '') : Math.round(v)) + 'B';
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
  const [burst, setBurst] = React.useState(false);
  const fire = () => { setBurst(true); setTimeout(() => setBurst(false), 420); onClick && onClick(); };
  return (
    <button onClick={fire}
      onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.78)'; }}
      onPointerUp={e => { e.currentTarget.style.transform = ''; }}
      onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6, background: 'none', border: 'none',
        padding: '4px 2px', cursor: 'pointer',
        color: active ? activeColor : 'var(--slate-400)',
        fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: active ? 700 : 500,
        transition: 'color 150ms, transform 120ms var(--ease-spring)',
      }}>
      <span style={{
        display: 'flex',
        transform: burst ? 'scale(1.40)' : active ? 'scale(1.12)' : 'scale(1)',
        filter: active ? `drop-shadow(0 0 5px ${activeColor}99)` : 'none',
        transition: 'transform 260ms var(--ease-spring), filter 200ms',
      }}>{React.cloneElement(icon, { fill: active ? activeColor : 'none' })}</span>
      {label != null && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{label}</span>}
    </button>
  );
}

// ── IconLabel — section header with icon prefix ────────────────────
function IconLabel({ icon, children, style }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, ...style }}>
      {icon && (
        <div style={{
          width: 26, height: 26, borderRadius: 8,
          background: 'var(--rose-tint-bg)', border: '1px solid var(--rose-tint-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Ico d={icon} size={14} style={{ color: 'var(--rose-tint-text)' }} stroke={2}/>
        </div>
      )}
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, letterSpacing: '0.11em',
        textTransform: 'uppercase', fontWeight: 700, color: 'var(--slate-500)',
      }}>{children}</span>
    </div>
  );
}
// Lighter / more versatile than Tag — no all-caps, pill shape
function Badge({ variant = 'default', children, style }) {
  const bvars = {
    default:     { background: 'var(--stamp-red)', color: 'var(--paper)' },
    secondary:   { background: 'var(--slate-100)', color: 'var(--slate-600)', border: '1px solid var(--slate-200)' },
    outline:     { background: 'transparent', color: 'var(--slate-700)', border: '1px solid var(--slate-300)' },
    success:     { background: 'var(--emerald-soft)', color: 'var(--emerald)' },
    warning:     { background: 'var(--amber-soft)', color: 'var(--amber)' },
    destructive: { background: 'var(--stamp-red-soft)', color: 'var(--stamp-red)' },
    teal:        { background: 'var(--verified-teal-soft)', color: 'var(--verified-teal)' },
    plum:        { background: 'var(--plum-soft)', color: 'var(--plum)' },
    sky:         { background: 'var(--sky-soft)', color: 'var(--sky)' },
    violet:      { background: 'var(--violet-soft)', color: 'var(--violet)' },
    slate:       { background: 'var(--slate-100)', color: 'var(--slate-500)' },
    dark:        { background: 'var(--slate-800)', color: 'var(--paper)' },
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 999, lineHeight: 1,
      fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 11.5,
      letterSpacing: '0.01em', whiteSpace: 'nowrap',
      ...bvars[variant] || bvars.default, ...style,
    }}>{children}</span>
  );
}

// ── Shadcn-style Card system ──────────────────────────────────
function Card({ children, style, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: 'var(--card)', border: '1px solid var(--border)',
      borderRadius: 'var(--r-lg)', boxShadow: 'var(--shadow-1)',
      overflow: 'hidden', ...style,
    }}>{children}</div>
  );
}
function CardHeader({ children, style }) {
  return (
    <div style={{ padding: '20px 24px 0', display: 'flex', flexDirection: 'column', gap: 4, ...style }}>
      {children}
    </div>
  );
}
function CardContent({ children, style }) {
  return (
    <div style={{ padding: '16px 24px 20px', ...style }}>{children}</div>
  );
}
function CardFooter({ children, style }) {
  return (
    <div style={{
      padding: '0 24px 20px', display: 'flex', alignItems: 'center', gap: 10, ...style,
    }}>{children}</div>
  );
}
function CardTitle({ children, style }) {
  return (
    <div style={{
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18,
      letterSpacing: '-0.02em', color: 'var(--ink)', lineHeight: 1.2, ...style,
    }}>{children}</div>
  );
}
function CardDescription({ children, style }) {
  return (
    <div style={{
      fontSize: 13.5, color: 'var(--muted-foreground)', lineHeight: 1.55, ...style,
    }}>{children}</div>
  );
}

// ── Shadcn-style Separator ────────────────────────────────────
function Separator({ orientation = 'horizontal', style }) {
  return (
    <div style={
      orientation === 'horizontal'
        ? { height: 1, background: 'var(--border)', flexShrink: 0, ...style }
        : { width: 1, background: 'var(--border)', alignSelf: 'stretch', flexShrink: 0, ...style }
    }/>
  );
}

// ── Shadcn-style Input ────────────────────────────────────────
function Input({ value, onChange, onSubmit, placeholder, type = 'text', icon, disabled, style }) {
  return (
    <div style={{ position: 'relative', width: '100%', ...style }}>
      {icon && (
        <div style={{
          position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)',
          color: 'var(--ink-faint)', pointerEvents: 'none',
          display: 'flex', alignItems: 'center',
        }}>{icon}</div>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        onKeyDown={e => e.key === 'Enter' && onSubmit && onSubmit()}
        style={{
          width: '100%', height: 42, padding: icon ? '0 14px 0 40px' : '0 14px',
          borderRadius: 12, border: '1px solid var(--input-border)',
          background: 'var(--paper)', fontFamily: 'var(--font-body)',
          fontSize: 14, color: 'var(--ink)', outline: 'none',
          boxSizing: 'border-box', transition: 'border-color 150ms, box-shadow 150ms',
          opacity: disabled ? 0.5 : 1,
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--stamp-red)';
          e.target.style.boxShadow = '0 0 0 3px var(--ring)';
        }}
        onBlur={e => {
          e.target.style.borderColor = '';
          e.target.style.boxShadow = '';
        }}
      />
    </div>
  );
}

// ── StackedAvatars — social-proof overlap row ───────────────
function StackedAvatars({ items = [], max = 3, label, style }) {
  const PALETTE = ['#FF2442','#8B5CF6','#10B981','#F59E0B','#0EA5E9','#E94560'];
  const shown = items.slice(0, max);
  const overflow = items.length - max;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, ...style }}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {shown.map((item, i) => {
          const name = typeof item === 'string' ? item : (item.name || '?');
          const color = (typeof item === 'object' && item.color) ? item.color : PALETTE[i % PALETTE.length];
          const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
          return (
            <div key={i} style={{
              width: 26, height: 26, borderRadius: '50%',
              border: '2px solid var(--card-surface)',
              background: color, color: '#fff',
              fontSize: 9, fontWeight: 800,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginLeft: i === 0 ? 0 : -9,
              position: 'relative', zIndex: shown.length - i, flexShrink: 0,
            }}>{initials}</div>
          );
        })}
        {overflow > 0 && (
          <div style={{
            width: 26, height: 26, borderRadius: '50%',
            border: '2px solid var(--card-surface)',
            background: 'var(--slate-200)', color: 'var(--slate-600)',
            fontSize: 9, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginLeft: -9, flexShrink: 0,
          }}>+{overflow}</div>
        )}
      </div>
      {label && <span style={{ fontSize: 12, color: 'var(--slate-500)', fontWeight: 500 }}>{label}</span>}
    </div>
  );
}

// ── LocationTag ───────────────────────────────────────────────
function LocationTag({ children, style }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 9px', borderRadius: 999,
      background: 'rgba(14,165,233,0.10)', border: '1px solid rgba(14,165,233,0.22)',
      color: 'var(--sky)', fontSize: 12, fontWeight: 600, lineHeight: 1,
      ...style,
    }}>📍 {children}</span>
  );
}

// ── GlassPill — floats inside image areas ─────────────────────
function GlassPill({ children, variant = 'dark', style }) {
  const bgs = {
    dark:  'rgba(15,23,42,0.52)',
    red:   'rgba(255,36,66,0.78)',
    white: 'rgba(255,255,255,0.72)',
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '5px 11px', borderRadius: 999,
      background: bgs[variant] || bgs.dark,
      backdropFilter: 'blur(8px) saturate(180%)',
      WebkitBackdropFilter: 'blur(8px) saturate(180%)',
      border: '1px solid rgba(255,255,255,0.18)',
      color: '#fff', fontSize: 12, fontWeight: 600, lineHeight: 1,
      ...style,
    }}>{children}</span>
  );
}

// ── FeedBadgePill — single badge shown next to author name in feed
// Priority: First Start > Rank  (logic in feedBadge() in data.jsx)
function FeedBadgePill({ u, onClick }) {
  const b = feedBadge(u);
  if (!b) return null;
  const isRank = b.type === 'rank';
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick && onClick(b); }}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '2px 7px', borderRadius: 999,
        background: isRank ? 'transparent' : b.color,
        color: isRank ? b.color : (b.textColor || '#fff'),
        border: `1px solid ${b.color}`,
        fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10,
        cursor: 'pointer', lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0,
        outline: 'none', letterSpacing: '0.02em',
      }}>
      {b.emoji && <span style={{ fontSize: 9 }}>{b.emoji}</span>}
      {b.label}
    </button>
  );
}

// ── BadgeSheet — bottom sheet explaining any badge type
function BadgeSheet({ badge, onClose }) {
  if (!badge) return null;
  const typeLabels = { firstStart: 'Permanent badge', rank: 'Rank badge', season: 'Season badge' };
  const hasEmoji = !!badge.emoji;
  return (
    <div onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.40)', zIndex: 200, display: 'flex', alignItems: 'flex-end' }}>
      <div onClick={e => e.stopPropagation()}
        style={{ width: '100%', background: 'var(--paper)', borderRadius: '20px 20px 0 0', padding: '8px 0 40px', boxShadow: '0 -4px 28px rgba(0,0,0,0.14)' }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--border-strong)', margin: '8px auto 22px' }}/>
        <div style={{ textAlign: 'center', padding: '0 28px 22px' }}>
          {/* Icon */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
            {hasEmoji ? (
              <div style={{ width: 76, height: 76, borderRadius: 20, background: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, boxShadow: `0 6px 24px ${badge.color}55` }}>
                {badge.emoji}
              </div>
            ) : (
              <div style={{ width: 76, height: 76, borderRadius: '50%', background: badge.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, boxShadow: `0 6px 24px ${badge.color}55` }}>
                {badge.type === 'season' ? ({ gold: '🥇', silver: '🥈', bronze: '🥉', finalist: '🏅' }[badge.tier] || '🏅') : <span style={{ fontSize: 30, fontWeight: 800, color: badge.textColor || '#fff', fontFamily: 'var(--font-display)' }}>{badge.label.charAt(0)}</span>}
              </div>
            )}
          </div>
          {/* Type label */}
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--ink-faint)', marginBottom: 6 }}>
            {typeLabels[badge.type] || 'Badge'}
          </div>
          {/* Name */}
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 12 }}>
            {badge.type === 'season' ? ({ gold: 'Gold Badge', silver: 'Silver Badge', bronze: 'Bronze Badge', finalist: 'Finalist Badge' }[badge.tier] || 'Season Badge') : badge.label}
          </div>
          {/* Description */}
          <div style={{ fontSize: 14, color: 'var(--ink-mute)', lineHeight: 1.65, maxWidth: 280, margin: '0 auto' }}>
            {badge.desc}
          </div>
        </div>
        <div style={{ padding: '0 20px' }}>
          <button onClick={onClose} style={{
            width: '100%', padding: '14px', borderRadius: 14, border: 'none',
            background: 'var(--bone)', color: 'var(--ink)', fontFamily: 'var(--font-body)',
            fontWeight: 600, fontSize: 15, cursor: 'pointer',
          }}>Got it</button>
        </div>
      </div>
    </div>
  );
}

// Small reviewed/pending indicator for catalogue items — Scorred seal if reviewed, clock if pending
function ReviewIcon({ reviewed, size = 16 }) {
  if (reviewed) {
    const SM = window.SealMark;
    return (
      <div title="Scorred Reviewed" style={{ width: size, height: size, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {SM ? <SM size={size}/> : null}
      </div>
    );
  }
  return (
    <div title="Pending Review" style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bone-deep)', border: '1px solid var(--border-strong)',
    }}>
      <Ico d={Icons.clock} size={size * 0.62} stroke={2.4} style={{ color: 'var(--ink-faint)' }}/>
    </div>
  );
}

Object.assign(window, {
  Ico, Icons, Avatar, Tag, PostTypeTag, VerifyBadge, TierChip, TrustSignals, Stars, statusLabel, ReviewIcon,
  Button, IconButton, CategoryChip, Segmented, Stamp, ProductPhoto, Divider, Money, compactNum, ActionBtn, QRCode,
  StackedAvatars, LocationTag, GlassPill,
  Badge, Card, CardHeader, CardContent, CardFooter, CardTitle, CardDescription, Separator, Input,
  IconLabel, FeedBadgePill, BadgeSheet, avatarFrame, avatarFramePip,
});
