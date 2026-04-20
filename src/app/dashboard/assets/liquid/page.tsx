'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import type { AssetLiquid } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'

const TYPE_LABELS: Record<string, { label: string; emoji: string; bg: string; fg: string }> = {
  cash:            { label: 'Kas',           emoji: '💵', bg: '#FEF3C7', fg: '#92400E' },
  bank:            { label: 'Bank',          emoji: '🏦', bg: '#DBEAFE', fg: '#1E40AF' },
  digital_wallet:  { label: 'E-Wallet',      emoji: '📱', bg: '#E9D5FF', fg: '#6B21A8' },
  receivable:      { label: 'Piutang',       emoji: '🤝', bg: '#FCE7F3', fg: '#9D174D' },
}

interface FormState {
  id: string | null
  name: string
  type: 'cash' | 'bank' | 'digital_wallet' | 'receivable'
  balance: number
}
const EMPTY: FormState = { id: null, name: '', type: 'bank', balance: 0 }

export default function LiquidAssetsPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [items, setItems] = useState<AssetLiquid[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [form, setForm] = useState<FormState>(EMPTY)
  const [saving, setSaving] = useState(false)

  useEffect(() => { void load() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data } = await supabase.from('assets_liquid').select('*').eq('user_id', user.id).order('balance', { ascending: false })
    setItems((data ?? []) as AssetLiquid[])
    setLoading(false)
  }

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    const now = new Date()
    const payload = {
      user_id: user.id,
      name: form.name,
      type: form.type,
      balance: form.balance,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    }
    if (form.id) await supabase.from('assets_liquid').update(payload).eq('id', form.id)
    else await supabase.from('assets_liquid').insert(payload)
    setSaving(false)
    setDialogOpen(false)
    void load()
  }

  async function remove(id: string) {
    if (!confirm('Hapus aset ini?')) return
    await supabase.from('assets_liquid').delete().eq('id', id)
    void load()
  }

  const total = items.reduce((s, a) => s + a.balance, 0)
  const byType = items.reduce((acc, a) => {
    acc[a.type] = (acc[a.type] || 0) + a.balance
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="space-y-6">
      <div className="dark-card p-6 sm:p-7">
        <p className="caps">Aset Likuid</p>
        <p className="num tabular mt-3 text-white text-4xl sm:text-5xl font-semibold">
          {formatCurrency(total)}
        </p>
        <p className="text-sm mt-2" style={{ color: 'var(--on-black-mut)' }}>
          {items.length} aset · dapat dicairkan cepat
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {Object.entries(byType).map(([type, val]) => {
            const info = TYPE_LABELS[type]
            return (
              <span
                key={type}
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: 'var(--black-2)',
                  color: 'var(--on-black)',
                  border: '1px solid var(--black-line)',
                }}
              >
                {info?.label ?? type} <span className="num opacity-70">· {formatCurrency(val)}</span>
              </span>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--ink-muted)' }}>
          Kelola tabungan, kas, e-wallet, dan piutang Anda.
        </p>
        <Button onClick={() => { setForm(EMPTY); setDialogOpen(true) }}>
          <Plus className="h-4 w-4" />
          Tambah Aset
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'var(--indigo-600)' }} />
        </div>
      ) : items.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <p className="text-5xl">💧</p>
          <p className="mt-3 font-semibold" style={{ color: 'var(--ink)' }}>Belum ada aset likuid</p>
          <p className="text-sm mt-1" style={{ color: 'var(--ink-muted)' }}>Tambahkan rekening atau kas Anda.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => {
            const info = TYPE_LABELS[a.type] ?? TYPE_LABELS.bank
            return (
              <div
                key={a.id}
                className="group relative rounded-lg p-5 bg-white border border-[var(--border-soft)] hover:border-[var(--ink)] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--ink)' }}>{a.name}</p>
                    <Badge className="mt-1 rounded-sm px-1.5 py-0 text-[10px] border-0 font-medium" style={{ background: 'var(--surface-2)', color: 'var(--ink-muted)' }}>
                      {info?.label ?? a.type}
                    </Badge>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <Button variant="ghost" size="icon-sm" onClick={() => { setForm({ id: a.id, name: a.name, type: a.type, balance: a.balance }); setDialogOpen(true) }}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon-sm" onClick={() => remove(a.id)}>
                      <Trash2 className="h-3.5 w-3.5" style={{ color: 'var(--danger)' }} />
                    </Button>
                  </div>
                </div>
                <p className="num text-2xl mt-4 tabular font-semibold" style={{ color: 'var(--ink)' }}>
                  {formatCurrency(a.balance)}
                </p>
              </div>
            )
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? 'Edit Aset Likuid' : 'Tambah Aset Likuid'}</DialogTitle>
            <DialogDescription>Isi detail rekening, kas, atau piutang Anda.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label>Nama</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="BCA Tahapan, GoPay, Kas Rumah" />
            </div>
            <div className="grid gap-1.5">
              <Label>Tipe</Label>
              <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v as FormState['type'] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_LABELS).map(([k, v]) => (
                    <SelectItem key={k} value={k}>{v.emoji} {v.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Saldo (Rp)</Label>
              <Input type="number" value={form.balance || ''} onChange={(e) => setForm({ ...form, balance: Number(e.target.value) || 0 })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={saving || !form.name}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {form.id ? 'Simpan' : 'Tambah'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
