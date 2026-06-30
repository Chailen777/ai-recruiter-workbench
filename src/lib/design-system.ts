export const designSystem = {
  colors: {
    primary: '#2563eb',
    success: '#16a34a',
    warning: '#f59e0b',
    danger: '#ef4444',
    background: '#f5f7fb',
    card: '#ffffff',
    border: '#e5e7eb',
    textPrimary: '#111827',
    textSecondary: '#6b7280',
  },
  spacing: {
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '14px',
  },
  shadow: {
    card: '0 10px 24px rgb(15 23 42 / 6%)',
    hover: '0 16px 36px rgb(15 23 42 / 10%)',
  },
  typography: {
    h1: {
      fontSize: '30px',
      fontWeight: 900,
      lineHeight: '1.18',
    },
    h2: {
      fontSize: '20px',
      fontWeight: 900,
      lineHeight: '1.25',
    },
    body: {
      fontSize: '14px',
      fontWeight: 400,
      lineHeight: '1.6',
    },
    caption: {
      fontSize: '12px',
      fontWeight: 500,
      lineHeight: '1.45',
    },
  },
} as const

export type DesignSystem = typeof designSystem
