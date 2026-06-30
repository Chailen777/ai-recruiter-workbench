'use client'

import { useEffect } from 'react'

type KeyHandler = (e: KeyboardEvent) => void

interface Shortcut {
  key: string
  /** Physical key code — more reliable for special keys like Space. e.g. 'Space', 'Escape' */
  code?: string
  ctrl?: boolean
  alt?: boolean
  shift?: boolean
  /** Only fire when no input/textarea/select is focused */
  ignoreInputs?: boolean
  handler: KeyHandler
  description: string
}

function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName?.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'option'
}

export function useKeyboardShortcut(shortcut: Shortcut, deps: unknown[] = []) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Match modifiers
      const ctrlOk = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !e.ctrlKey && !e.metaKey
      const altOk = shortcut.alt ? e.altKey : !e.altKey
      const shiftOk = shortcut.shift ? e.shiftKey : !e.shiftKey

      const keyMatch = e.key?.toLowerCase() === shortcut.key.toLowerCase()
      const codeMatch = shortcut.code ? e.code === shortcut.code : false
      const effectiveMatch = keyMatch || codeMatch

      if (effectiveMatch && ctrlOk && altOk && shiftOk) {
        if (shortcut.ignoreInputs !== false && isInputFocused()) return
        e.preventDefault()
        e.stopPropagation()
        shortcut.handler(e)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shortcut.key, shortcut.code, shortcut.ctrl, shortcut.alt, shortcut.shift, ...deps])
}

export type { Shortcut }
