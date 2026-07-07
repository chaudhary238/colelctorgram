import React from 'react';

const PALETTE = ['var(--stamp-red)', 'var(--plum)', 'var(--verified-teal)', 'var(--forest)', 'var(--grail-gold)', 'var(--ink-mute)'];

function pickColor(name) {
  const code = (name || 'x').charCodeAt(0);
  return PALETTE[code % PALETTE.length];
}

/**
 * User avatar — single-initial fallback with brand-palette background,
 * optional photo, optional verified badge.
 */
export function Avatar({ name = '?', color, size = 36, verified = false, photo }) {
  const initial = (name || '?').slice(0, 1).toUpperCase();
  const bg = color ?? pickColor(name);
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: photo ? 'transparent' : bg,
      color: 'var(--paper)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: size * 0.4,
      position: 'relative', flexShrink: 0, letterSpacing: '-0.02em', overflow: 'visible',
      backgroundImage: photo ? `url(${photo})` : 'none',
      backgroundSize: 'cover', backgroundPosition: 'center',
    }}>
      {!photo && initial}
      {verified && (
        <div style={{
          position: 'absolute', bottom: -1, right: -1,
          width: Math.round(size * 0.42), height: Math.round(size * 0.42),
          borderRadius: '50%',
          background: 'var(--verified-teal)', color: 'var(--paper)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '2px solid var(--paper)',
        }}>
          <svg
            width={Math.round(size * 0.22)} height={Math.round(size * 0.22)}
            viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth={3.5}
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="m5 12 5 5L20 7"/>
          </svg>
        </div>
      )}
    </div>
  );
}
