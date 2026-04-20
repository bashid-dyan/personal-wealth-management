'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { NAV_ITEMS, type NavItem } from '@/lib/constants'
import { Search } from 'lucide-react'

function flatten(items: NavItem[], trail: string[] = []): { label: string; href: string; breadcrumb: string }[] {
  const out: { label: string; href: string; breadcrumb: string }[] = []
  for (const it of items) {
    out.push({ label: it.label, href: it.href, breadcrumb: trail.join(' › ') })
    if (it.children) out.push(...flatten(it.children, [...trail, it.label]))
  }
  return out
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)
  const router = useRouter()

  const all = useMemo(() => {
    // Include direct action shortcuts
    const extras = [
      { label: 'Tambah Transaksi',  href: '/dashboard/transactions',  breadcrumb: 'Quick Action' },
      { label: 'Tambah Goal',       href: '/dashboard/goals',         breadcrumb: 'Quick Action' },
      { label: 'Bayar Kartu Kredit',href: '/dashboard/credit-cards',  breadcrumb: 'Quick Action' },
      { label: 'Atur Budget',       href: '/dashboard/budgeting',     breadcrumb: 'Quick Action' },
      { label: 'Kalkulator Zakat',  href: '/dashboard/calculators',   breadcrumb: 'Quick Action' },
    ]
    return [...flatten(NAV_ITEMS), ...extras]
  }, [])

  const filtered = useMemo(() => {
    if (!query.trim()) return all
    const q = query.toLowerCase()
    return all.filter(
      (i) => i.label.toLowerCase().includes(q) || i.breadcrumb.toLowerCase().includes(q),
    )
  }, [query, all])

  useEffect(() => {
    setSelectedIdx(0)
  }, [query])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen((o) => !o)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setSelectedIdx(0)
    }
  }, [open])

  function go(idx: number) {
    const target = filtered[idx]
    if (!target) return
    router.push(target.href)
    setOpen(false)
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIdx((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIdx((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      go(selectedIdx)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] px-4"
      style={{ background: 'rgba(10,10,10,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-lg rounded-xl overflow-hidden border shadow-2xl"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: 'var(--border-soft)' }}>
          <Search className="h-4 w-4" style={{ color: 'var(--ink-muted)' }} />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Cari halaman atau aksi..."
            className="flex-1 bg-transparent outline-none text-sm"
            style={{ color: 'var(--ink)' }}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'var(--surface-2)', color: 'var(--ink-muted)' }}>
            ESC
          </kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <p className="text-sm py-8 text-center" style={{ color: 'var(--ink-soft)' }}>
              Tidak ada hasil.
            </p>
          ) : (
            filtered.map((item, i) => (
              <button
                key={`${item.href}-${item.label}-${i}`}
                onClick={() => go(i)}
                onMouseEnter={() => setSelectedIdx(i)}
                className="w-full text-left px-4 py-2.5 flex items-center justify-between transition-colors"
                style={{
                  background: i === selectedIdx ? 'var(--lime-100)' : 'transparent',
                }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>{item.label}</span>
                {item.breadcrumb && (
                  <span className="text-[11px]" style={{ color: 'var(--ink-soft)' }}>
                    {item.breadcrumb}
                  </span>
                )}
              </button>
            ))
          )}
        </div>
        <div
          className="flex items-center justify-between px-4 py-2 text-[10px] border-t"
          style={{ borderColor: 'var(--border-soft)', color: 'var(--ink-soft)' }}
        >
          <span className="font-mono">↑↓ navigasi · Enter pilih · Esc tutup</span>
          <span>
            <kbd className="font-mono px-1 py-0.5 rounded" style={{ background: 'var(--surface-2)' }}>⌘</kbd>
            <kbd className="font-mono px-1 py-0.5 rounded ml-0.5" style={{ background: 'var(--surface-2)' }}>K</kbd>
          </span>
        </div>
      </div>
    </div>
  )
}
