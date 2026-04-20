'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { messages, type Locale } from './messages'

const STORAGE_KEY = 'pwm.locale'

interface I18nContextValue {
  locale: Locale
  setLocale: (l: Locale) => void
  t: (path: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('id')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = window.localStorage.getItem(STORAGE_KEY) as Locale | null
    if (saved === 'id' || saved === 'en') {
      setLocaleState(saved)
      document.documentElement.lang = saved
    }
  }, [])

  function setLocale(l: Locale) {
    setLocaleState(l)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, l)
      document.documentElement.lang = l
    }
  }

  /**
   * Translate by dot-path: t('nav.dashboard') or t('common.save').
   * Falls back to Indonesian if key missing in English, or returns path if missing entirely.
   */
  function t(path: string): string {
    const parts = path.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const walk = (obj: any): string | undefined => {
      let cur = obj
      for (const p of parts) {
        if (cur == null) return undefined
        cur = cur[p]
      }
      return typeof cur === 'string' ? cur : undefined
    }
    return walk(messages[locale]) ?? walk(messages.id) ?? path
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within LanguageProvider')
  return ctx
}

// Shortcut hook returning just t
export function useT() {
  return useI18n().t
}
