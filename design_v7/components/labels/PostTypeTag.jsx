import React from 'react';

const POST_TYPE_MAP = {
  post:       { label: 'Post',       color: '#999999',              bg: 'rgba(0,0,0,0.06)' },
  showcase:   { label: 'Showcase',   color: 'var(--verified-teal)', bg: 'rgba(45,143,135,0.12)' },
  discussion: { label: 'Discussion', color: 'var(--plum)',          bg: 'rgba(107,54,86,0.12)' },
  review:     { label: 'Review',     color: 'var(--grail-gold-deep)', bg: 'rgba(196,132,32,0.12)' },
  poll:       { label: 'Poll',       color: 'var(--stamp-red)',     bg: 'rgba(255,36,66,0.10)' },
  iso:        { label: 'ISO',        color: '#B07724',              bg: 'rgba(176,119,36,0.13)' },
};

/**
 * All-caps type pill shown on every post card.
 * Maps post type → colour + background automatically.
 */
export function PostTypeTag({ type }) {
  const m = POST_TYPE_MAP[type] ?? POST_TYPE_MAP.post;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '4px 8px', borderRadius: 6,
      background: m.bg, color: m.color,
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 10,
      letterSpacing: '0.07em', textTransform: 'uppercase',
      whiteSpace: 'nowrap', flexShrink: 0,
    }}>{m.label}</span>
  );
}
