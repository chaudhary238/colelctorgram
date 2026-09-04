import React from 'react';

/** Square icon-only button used in AppBar and card action rows. */
export function IconButton({ icon, onClick, active, badge, size = 40, radius = 13, style }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: size, height: size, borderRadius: radius, position: 'relative',
        background: active ? 'var(--ink)' : 'transparent',
        color: active ? 'var(--paper)' : 'var(--ink)',
        border: '1px solid ' + (active ? 'var(--ink)' : 'var(--border)'),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, outline: 'none',
        transition: 'background 120ms, border-color 120ms, box-shadow 120ms',
        ...style,
      }}
      onFocus={e => { e.currentTarget.style.boxShadow = '0 0 0 3px rgba(255,36,66,0.30)'; }}
      onBlur={e => { e.currentTarget.style.boxShadow = ''; }}
    >
      {icon}
      {badge ? (
        <span style={{
          position: 'absolute', top: -3, right: -3,
          minWidth: 16, height: 16, padding: '0 4px',
          borderRadius: 999, background: 'var(--stamp-red)', color: 'var(--paper)',
          fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-mono)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: '1.5px solid var(--paper)',
        }}>{badge}</span>
      ) : null}
    </button>
  );
}
