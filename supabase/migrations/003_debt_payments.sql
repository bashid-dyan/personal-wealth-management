-- ============================================
-- Debt Payments — payment log per debt
-- ============================================

create table if not exists public.debt_payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  debt_id uuid references public.debts on delete cascade not null,
  amount bigint not null default 0,
  date date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_debt_payments_user_id on public.debt_payments (user_id);
create index if not exists idx_debt_payments_debt_id on public.debt_payments (debt_id);

-- RLS
alter table public.debt_payments enable row level security;

drop policy if exists "Users can view own debt_payments" on public.debt_payments;
create policy "Users can view own debt_payments"
  on public.debt_payments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own debt_payments" on public.debt_payments;
create policy "Users can insert own debt_payments"
  on public.debt_payments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own debt_payments" on public.debt_payments;
create policy "Users can update own debt_payments"
  on public.debt_payments for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own debt_payments" on public.debt_payments;
create policy "Users can delete own debt_payments"
  on public.debt_payments for delete
  using (auth.uid() = user_id);
