'use client'

import { useI18n } from '@/lib/i18n/context'
import { Globe } from 'lucide-react'

export function LanguageToggle() {
  const { locale, setLocale } = useI18n()
  const next = locale === 'id' ? 'en' : 'id'

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      className="flex h-8 items-center gap-1.5 px-2 rounded-md transition-colors hover:bg-[var(--surface-2)]"
      style={{ color: 'var(--ink-muted)' }}
      aria-label={`Switch to ${next === 'id' ? 'Bahasa Indonesia' : 'English'}`}
      title={`Switch to ${next === 'id' ? 'ID' : 'EN'}`}
    >
      <Globe className="h-3.5 w-3.5" />
      <span className="text-[11px] font-semibold uppercase tabular">{locale}</span>
    </button>
  )
}
