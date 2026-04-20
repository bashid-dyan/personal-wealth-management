-- ============================================
-- Goals, Recurring, Dividends, Net Worth Snapshots
-- ============================================

-- Financial Goals
create table if not exists public.goals (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  category text not null default 'other',
  target_amount bigint not null default 0,
  current_amount bigint not null default 0,
  deadline date,
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_goals_user_id on public.goals (user_id);
alter table public.goals enable row level security;
drop policy if exists "Users can manage own goals" on public.goals;
create policy "Users can manage own goals" on public.goals for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Recurring Transactions (templates that generate transactions on schedule)
create table if not exists public.recurring_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text not null check (type in ('income', 'expense', 'saving', 'investment')),
  category text not null,
  amount bigint not null default 0,
  account_id uuid references public.accounts on delete set null,
  frequency text not null default 'monthly' check (frequency in ('daily','weekly','monthly','yearly')),
  day_of_period int not null default 1,
  start_date date not null default current_date,
  end_date date,
  last_run_date date,
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_recurring_user_id on public.recurring_transactions (user_id);
alter table public.recurring_transactions enable row level security;
drop policy if exists "Users can manage own recurring" on public.recurring_transactions;
create policy "Users can manage own recurring" on public.recurring_transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Dividends (per stock investment)
create table if not exists public.dividends (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  investment_id uuid references public.investments on delete cascade,
  ticker text,
  amount bigint not null default 0,
  shares numeric not null default 0,
  ex_date date,
  pay_date date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_dividends_user_id on public.dividends (user_id);
alter table public.dividends enable row level security;
drop policy if exists "Users can manage own dividends" on public.dividends;
create policy "Users can manage own dividends" on public.dividends for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Net Worth Snapshots (monthly for historical chart)
create table if not exists public.net_worth_snapshots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  snapshot_date date not null default current_date,
  total_assets bigint not null default 0,
  total_debts bigint not null default 0,
  net_worth bigint not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, snapshot_date)
);
create index if not exists idx_nws_user_id on public.net_worth_snapshots (user_id);
alter table public.net_worth_snapshots enable row level security;
drop policy if exists "Users can manage own nws" on public.net_worth_snapshots;
create policy "Users can manage own nws" on public.net_worth_snapshots for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
