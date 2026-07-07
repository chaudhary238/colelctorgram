import React from 'react';

const BADGE_STYLES = {
  default:     { background: 'var(--stamp-red)',         color: 'var(--paper)' },
  secondary:   { background: 'var(--slate-100, #F1F5F9)', color: 'var(--slate-600, #475569)', border: '1px solid var(--slate-200, #E2E8F0)' },
  outline:     { background: 'transparent',              color: 'var(--ink)',       border: '1px solid var(--border-strong)' },
  success:     { background: 'var(--forest-soft)',        color: 'var(--forest)' },
  warning:     { background: 'var(--grail-gold-soft)',    color: 'var(--grail-gold-deep)' },
  destructive: { background: 'var(--stamp-red-soft)',     color: 'var(--stamp-red)' },
  teal:        { background: 'var(--verified-teal-soft)', color: 'var(--verified-teal)' },
  plum:        { background: 'var(--plum-soft)',          color: 'var(--plum)' },
  dark:        { background: 'var(--ink)',                color: 'var(--paper)' },
};

/**
 * Versatile inline label — sentence-case, pill shape, 11.5px.
 * Use for status, categories, and feature flags anywhere in the UI.
 */
export function Badge({ variant = 'default', children, style }) {
  const s = BADGE_STYLES[variant] ?? BADGE_STYLES.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 9px', borderRadius: 999, lineHeight: 1,
      fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 11.5,
      letterSpacing: '0.01em', whiteSpace: 'nowrap',
      ...s, ...style,
    }}>{children}</span>
  );
}
