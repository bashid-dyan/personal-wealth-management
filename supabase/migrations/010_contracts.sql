-- ============================================
-- Contracts (expiry tracking): asuransi, langganan,
-- KPR/kredit, garansi, sewa, dll
-- ============================================

create table public.contracts (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text not null check (category in (
    'insurance', 'subscription', 'loan', 'warranty', 'lease', 'other'
  )),
  provider text not null default '',
  policy_number text not null default '',
  start_date date,
  end_date date not null,
  cost bigint,
  frequency text check (frequency in ('monthly', 'quarterly', 'yearly', 'one_time')),
  auto_renew boolean not null default false,
  reminder_days_before int not null default 30
    check (reminder_days_before between 1 and 365),
  is_archived boolean not null default false,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index contracts_user_id_end_date_idx
  on public.contracts (user_id, end_date)
  where is_archived = false;

alter table public.contracts enable row level security;

create policy "Users view own contracts"
  on public.contracts for select
  using (auth.uid() = user_id);

create policy "Users insert own contracts"
  on public.contracts for insert
  with check (auth.uid() = user_id);

create policy "Users update own contracts"
  on public.contracts for update
  using (auth.uid() = user_id);

create policy "Users delete own contracts"
  on public.contracts for delete
  using (auth.uid() = user_id);
