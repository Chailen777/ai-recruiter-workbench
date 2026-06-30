'use client'

import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark' | 'system'

type ResolvedTheme = 'light' | 'dark'

interface ThemeContextValue {
  resolvedTheme: ResolvedTheme
  setTheme: (theme: Theme) => void
  theme: Theme
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined)

export const STORAGE_KEY = 'ai-recruiter-theme'

function resolveTheme(theme: Theme): ResolvedTheme {
  if (theme === 'system') {
    if (typeof window === 'undefined') return 'light'
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const stored = (localStorage.getItem(STORAGE_KEY) as Theme | null) ?? 'system'
    setThemeState(stored)
    setResolvedTheme(resolveTheme(stored))
  }, [])

  useEffect(() => {
    if (!mounted) return
    const resolved = resolveTheme(theme)
    setResolvedTheme(resolved)
    document.documentElement.setAttribute('data-theme', resolved)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted) return
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = () => {
      if (theme === 'system') {
        setResolvedTheme(resolveTheme('system'))
      }
    }
    media.addEventListener('change', listener)
    return () => media.removeEventListener('change', listener)
  }, [theme, mounted])

  function setTheme(next: Theme) {
    const html = document.documentElement
    html.classList.add('is-changing-theme')
    setThemeState(next)
    window.setTimeout(() => html.classList.remove('is-changing-theme'), 0)
  }

  return (
    <ThemeContext.Provider value={{ resolvedTheme, setTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
