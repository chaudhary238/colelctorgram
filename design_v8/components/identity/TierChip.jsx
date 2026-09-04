import React from 'react';

const TIER_STYLES = {
  'Top Seller': { color: 'var(--stamp-red)',    border: '1px solid var(--stamp-red)' },
  'Trusted':    { color: 'var(--forest)',        border: '1px solid var(--forest)' },
  'Verified':   { color: 'var(--verified-teal)', border: '1px solid var(--verified-teal)' },
};

/**
 * Compact trust-tier pill shown on profiles and listing cards.
 * Renders nothing for base-level users (no tier).
 */
export function TierChip({ tier }) {
  const s = TIER_STYLES[tier];
  if (!s) return null;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '3px 8px', borderRadius: 999,
      color: s.color, border: s.border, background: 'transparent',
      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 10.5,
      letterSpacing: '0.04em', lineHeight: 1, whiteSpace: 'nowrap', flexShrink: 0,
    }}>
      <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
      </svg>
      {tier}
    </span>
  );
}
