import React from 'react';

// Framework-agnostic inline-style theme. Works with zero config in any React
// app. (Tailwind is also wired up in this project if you prefer to refactor.)
export const T = {
  bg: '#faf8fd',
  card: '#ffffff',
  ink: '#1e1b29',
  ink2: '#6b6677',
  muted: '#a29fb0',
  line: 'rgba(0,0,0,.08)',
  primary: '#7c3aed',
  primarySoft: '#f3e8ff',
  ok: '#16a34a',
  okBg: '#dcfce7',
  bad: '#dc2626',
  badBg: '#fee2e2',
  warn: '#d97706',
  warnBg: '#fef3c7',
  inA: { bg: '#e0f2fe', fg: '#0369a1' },
  withA: { bg: '#fce7f3', fg: '#be185d' },
  radius: 16,
  radiusSm: 10,
  sans: `'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif`,
};

export const card: React.CSSProperties = {
  background: T.card,
  border: `1px solid ${T.line}`,
  borderRadius: T.radius,
  padding: 20,
  boxShadow: '0 1px 3px rgba(0,0,0,.04)',
};

export const btn = (variant: 'solid' | 'ghost' = 'solid'): React.CSSProperties => ({
  background: variant === 'solid' ? T.primary : T.card,
  color: variant === 'solid' ? '#fff' : T.primary,
  border: variant === 'solid' ? 'none' : `1.5px solid ${T.primary}`,
  borderRadius: T.radiusSm,
  padding: '11px 20px',
  fontSize: 15,
  fontWeight: 700,
  fontFamily: T.sans,
  cursor: 'pointer',
  transition: 'all .15s',
});

export const label: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: T.ink2,
  textTransform: 'uppercase',
  letterSpacing: '.05em',
  marginBottom: 8,
};

export const input: React.CSSProperties = {
  width: '100%',
  border: `1.5px solid ${T.line}`,
  borderRadius: T.radiusSm,
  padding: '11px 13px',
  fontSize: 16,
  fontFamily: T.sans,
  boxSizing: 'border-box',
  outline: 'none',
};
