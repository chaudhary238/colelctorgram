import React from 'react';

/**
 * Text input with optional leading icon, focus ring, and keyboard submit.
 * Styled to CollectorHub's 42px compact height.
 */
export function Input({ value, onChange, onSubmit, placeholder, type = 'text', icon, disabled, style }) {
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
          width: '100%', height: 42,
          padding: icon ? '0 14px 0 40px' : '0 14px',
          borderRadius: 12, border: '1px solid var(--border-strong)',
          background: 'var(--paper)', fontFamily: 'var(--font-body)',
          fontSize: 14, color: 'var(--ink)', outline: 'none',
          boxSizing: 'border-box',
          transition: 'border-color 150ms, box-shadow 150ms',
          opacity: disabled ? 0.5 : 1,
        }}
        onFocus={e => {
          e.target.style.borderColor = 'var(--stamp-red)';
          e.target.style.boxShadow = '0 0 0 3px rgba(255,36,66,0.30)';
        }}
        onBlur={e => {
          e.target.style.borderColor = '';
          e.target.style.boxShadow = '';
        }}
      />
    </div>
  );
}
