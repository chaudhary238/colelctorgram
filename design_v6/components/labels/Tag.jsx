import React from 'react';

const TAG_STYLES = {
  sale:    { background: 'var(--stamp-red)',        color: 'var(--paper)' },
  po:      { background: 'var(--grail-gold)',        color: 'var(--ink)' },
  misb:    { background: 'var(--ink)',               color: 'var(--paper)' },
  sold:    { background: 'var(--forest)',            color: 'var(--paper)' },
  reserved:{ background: 'var(--grail-gold-soft)',   color: 'var(--grail-gold-deep)', border: '1px solid var(--grail-gold)' },
  vouch:   { background: 'var(--verified-teal-soft)',color: 'var(--verified-teal)',   border: '1px solid var(--verified-teal)' },
  event:   { background: 'var(--plum-soft)',         color: 'var(--plum)',            border: '1px solid var(--plum)' },
  default: { background: 'var(--bone)',              color: 'var(--ink)' },
};

/**
 * Status/kind label pill used on listing cards and item detail screens.
 * All-caps, 10px, slightly spaced — not a Badge (which is sentence-case).
 */
export function Tag({ kind = 'default', children, style }) {
  const s = TAG_STYLES[kind] ?? TAG_STYLES.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 8px', borderRadius: 5, lineHeight: 1,
      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 10,
      letterSpacing: '0.08em', textTransform: 'uppercase',
      ...s, ...style,
    }}>{children}</span>
  );
}
