import React from 'react';

/**
 * Hard-shadow stamp label for accent moments — brand seal, grail callouts, section markers.
 */
export function Stamp({ children, color = 'var(--stamp-red)', rotate = 2, style }) {
  return (
    <span style={{
      background: color, color: 'var(--paper)',
      padding: '4px 8px', borderRadius: 4,
      fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 11,
      letterSpacing: '0.10em', textTransform: 'uppercase',
      boxShadow: 'var(--shadow-stamp)',
      transform: `rotate(${rotate}deg)`,
      lineHeight: 1, whiteSpace: 'nowrap', display: 'inline-block',
      ...style,
    }}>{children}</span>
  );
}
