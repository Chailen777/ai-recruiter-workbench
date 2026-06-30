'use client'

import { useTheme } from '@/components/providers/ThemeProvider'

const options = [
  {
    icon: (
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    ),
    label: '浅色',
    value: 'light' as const,
  },
  {
    icon: (
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <rect height="14" rx="2" ry="2" width="20" x="2" y="3" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
    label: '自动',
    value: 'system' as const,
  },
  {
    icon: (
      <svg
        aria-hidden="true"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        viewBox="0 0 24 24"
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    ),
    label: '深色',
    value: 'dark' as const,
  },
]

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <div className="ui-theme-toggle" role="group" aria-label="主题切换">
      {options.map((option) => (
        <button
          key={option.value}
          aria-pressed={theme === option.value}
          className={theme === option.value ? 'active' : ''}
          onClick={() => setTheme(option.value)}
          title={option.label}
          type="button"
        >
          {option.icon}
          <span>{option.label}</span>
        </button>
      ))}
    </div>
  )
}
