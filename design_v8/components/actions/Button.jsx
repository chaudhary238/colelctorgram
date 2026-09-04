import React from 'react';

const VARIANTS = {
  primary:     { background: 'var(--stamp-red)',     color: 'var(--paper)',     border: '1px solid var(--stamp-red)' },
  secondary:   { background: 'var(--bone)',           color: 'var(--ink-soft)',  border: '1px solid var(--border-strong)' },
  outline:     { background: 'transparent',           color: 'var(--ink)',       border: '1px solid var(--border-strong)' },
  ghost:       { background: 'transparent',           color: 'var(--ink)',       border: '1px solid transparent' },
  dark:        { background: 'var(--ink)',            color: 'var(--paper)',     border: '1px solid var(--ink)' },
  teal:        { background: 'var(--verified-teal)',  color: 'var(--paper)',     border: '1px solid var(--verified-teal)' },
  grail:       { background: 'var(--grail-gold)',     color: 'var(--ink)',       border: '1px solid var(--grail-gold-deep)', boxShadow: 'var(--shadow-stamp)' },
  destructive: { background: 'var(--stamp-red-soft)', color: 'var(--stamp-red)', border: '1px solid rgba(255,36,66,0.25)' },
};

const SIZES = {
  sm:    { height: 34, padding: '0 14px', fontSize: 13, borderRadius: 9  },
  md:    { height: 46, padding: '0 20px', fontSize: 15, borderRadius: 14 },
  lg:    { height: 54, padding: '0 24px', fontSize: 16, borderRadius: 16 },
  block: { height: 52, padding: '0 22px', fontSize: 16, borderRadius: 14, width: '100%', justifyContent: 'center' },
};

/** Primary action button. All CollectorHub CTAs use this component. */
export function Button({ variant = 'primary', size = 'md', icon, children, onClick, style, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        fontFamily: 'var(--font-body)', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transition: 'transform 120ms, background 120ms, box-shadow 120ms',
        lineHeight: 1, whiteSpace: 'nowrap', outline: 'none',
        ...(VARIANTS[variant] ?? VARIANTS.primary),
        ...(SIZES[size]    ?? SIZES.md),
        ...style,
      }}
      onPointerDown={e => { if (!disabled) e.currentTarget.style.transform = 'scale(0.97)'; }}
      onPointerUp={e => { e.currentTarget.style.transform = ''; }}
      onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
      onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,36,66,0.30)'; }}
      onBlur={e => { e.currentTarget.style.boxShadow = ''; }}
    >
      {icon}{children}
    </button>
  );
}
