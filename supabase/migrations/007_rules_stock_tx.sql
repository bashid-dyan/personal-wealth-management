-- ============================================
-- Categorization Rules + Stock Transaction Log
-- + Goal contribution link on transactions
-- ============================================

-- Auto-categorize rules
create table if not exists public.categorization_rules (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  match_text text not null,
  type text not null check (type in ('income', 'expense', 'saving', 'investment')),
  category text not null,
  priority int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists idx_cat_rules_user_id on public.categorization_rules (user_id);
alter table public.categorization_rules enable row level security;
drop policy if exists "Users can manage own rules" on public.categorization_rules;
create policy "Users can manage own rules" on public.categorization_rules for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Stock transaction log (buy/sell)
create table if not exists public.stock_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  investment_id uuid references public.investments on delete set null,
  ticker text,
  side text not null check (side in ('buy', 'sell')),
  shares numeric not null default 0,
  price numeric not null default 0,
  fee bigint not null default 0,
  total bigint not null default 0,
  broker text not null default '',
  date date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists idx_stock_tx_user_id on public.stock_transactions (user_id);
alter table public.stock_transactions enable row level security;
drop policy if exists "Users can manage own stock_tx" on public.stock_transactions;
create policy "Users can manage own stock_tx" on public.stock_transactions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Add goal_id to transactions (link contribution)
alter table public.transactions
  add column if not exists goal_id uuid references public.goals on delete set null;
