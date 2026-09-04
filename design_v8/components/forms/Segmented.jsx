import React from 'react';

/**
 * Segmented control — tab-like switcher with bone background inset.
 * Used for feed tabs, profile tabs, and sort controls.
 */
export function Segmented({ options, value, onChange, style }) {
  return (
    <div style={{
      display: 'flex', background: 'var(--bone)',
      borderRadius: 12, padding: 4, gap: 2, ...style,
    }}>
      {options.map(o => {
        const active = o.id === value;
        return (
          <button
            key={o.id}
            onClick={() => onChange(o.id)}
            style={{
              flex: 1, padding: '8px 6px', borderRadius: 9, border: 'none',
              background: active ? 'var(--paper)' : 'transparent',
              color: active ? 'var(--ink)' : 'var(--ink-faint)',
              fontFamily: 'var(--font-body)', fontWeight: active ? 600 : 500, fontSize: 13,
              cursor: 'pointer', whiteSpace: 'nowrap', lineHeight: 1,
              boxShadow: active ? '0 1px 4px rgba(0,0,0,0.07)' : 'none',
              transition: 'all 120ms',
            }}
          >{o.label}</button>
        );
      })}
    </div>
  );
}
