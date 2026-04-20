'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  INCOME_CATEGORIES, EXPENSE_CATEGORIES, SAVING_CATEGORIES, INVESTMENT_CATEGORIES,
} from '@/lib/constants'
import type { Account, CreditCard } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Loader2 } from 'lucide-react'

type TxType = 'income' | 'expense' | 'saving' | 'investment'

function categoriesFor(type: TxType): readonly string[] {
  switch (type) {
    case 'income': return INCOME_CATEGORIES
    case 'expense': return EXPENSE_CATEGORIES
    case 'saving': return SAVING_CATEGORIES
    case 'investment': return INVESTMENT_CATEGORIES
  }
}

export function QuickAddFab() {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [cards, setCards] = useState<CreditCard[]>([])
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    account_id: '',
    type: 'expense' as TxType,
    category: 'Makanan',
    description: '',
    amount: 0,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const [a, c] = await Promise.all([
        supabase.from('accounts').select('*').eq('user_id', user.id),
        supabase.from('credit_cards').select('*').eq('user_id', user.id).eq('is_active', true),
      ])
      setAccounts((a.data ?? []) as Account[])
      setCards((c.data ?? []) as CreditCard[])
    })()
  }, [open, supabase])

  async function save() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSaving(false); return }
    await supabase.from('transactions').insert({
      user_id: user.id,
      date: form.date,
      account_id: form.account_id,
      type: form.type,
      category: form.category,
      description: form.description,
      amount: form.amount,
    })
    // If credit card and expense, bump outstanding
    const cc = cards.find((c) => c.id === form.account_id)
    if (cc && form.type === 'expense') {
      await supabase.from('credit_cards')
        .update({ current_balance: cc.current_balance + form.amount })
        .eq('id', cc.id)
    }
    setSaving(false)
    setOpen(false)
    setForm({
      date: new Date().toISOString().split('T')[0],
      account_id: '',
      type: 'expense',
      category: 'Makanan',
      description: '',
      amount: 0,
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg flex items-center justify-center z-30 transition-all hover:scale-110"
        style={{ background: 'var(--lime-400)', color: 'var(--ink)', border: '1px solid var(--lime-500)' }}
        aria-label="Tambah transaksi"
        title="Tambah transaksi (N)"
      >
        <Plus className="h-6 w-6 stroke-[2.5]" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Transaksi Cepat</DialogTitle>
            <DialogDescription>Catat pemasukan/pengeluaran tanpa pindah halaman.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Tipe</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => v && setForm({ ...form, type: v as TxType, category: categoriesFor(v as TxType)[0] })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="expense">Pengeluaran</SelectItem>
                    <SelectItem value="income">Pemasukan</SelectItem>
                    <SelectItem value="saving">Tabungan</SelectItem>
                    <SelectItem value="investment">Investasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-1.5">
                <Label>Kategori</Label>
                <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoriesFor(form.type).map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label>Jumlah</Label>
                <Input type="number" min={0} value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) || 0 })} />
              </div>
              <div className="grid gap-1.5">
                <Label>Tanggal</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="grid gap-1.5">
              <Label>Akun / Kartu</Label>
              <Select value={form.account_id} onValueChange={(v) => setForm({ ...form, account_id: v ?? '' })}>
                <SelectTrigger><SelectValue placeholder="Pilih akun" /></SelectTrigger>
                <SelectContent>
                  {accounts.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  {cards.map((c) => <SelectItem key={c.id} value={c.id}>Kredit · {c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Deskripsi</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Beli makanan..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button onClick={save} disabled={saving || !form.account_id || form.amount <= 0}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
