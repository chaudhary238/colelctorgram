import React from 'react';

/**
 * Pill-shaped filter chip used in the feed hashtag bar,
 * marketplace filter panel, and onboarding interest selection.
 */
export function CategoryChip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      onPointerDown={e => { e.currentTarget.style.transform = 'scale(0.94)'; }}
      onPointerUp={e => { e.currentTarget.style.transform = ''; }}
      onPointerLeave={e => { e.currentTarget.style.transform = ''; }}
      style={{
        padding: '8px 16px', borderRadius: 999,
        background: active ? 'var(--stamp-red)' : 'var(--paper)',
        color: active ? 'var(--paper)' : 'var(--ink)',
        border: `1px solid ${active ? 'var(--stamp-red)' : 'var(--border-strong)'}`,
        fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 500, fontSize: 13,
        cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1, flexShrink: 0,
        transition: 'all 150ms, transform 80ms',
      }}
    >{children}</button>
  );
}
