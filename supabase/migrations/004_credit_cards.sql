-- ============================================
-- Credit Cards — card management & charge tracking
-- ============================================

create table if not exists public.credit_cards (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  issuer text not null default '',
  last_four text not null default '',
  credit_limit bigint not null default 0,
  current_balance bigint not null default 0,
  billing_day int not null default 1 check (billing_day between 1 and 31),
  due_day int not null default 15 check (due_day between 1 and 31),
  interest_rate numeric not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_cards_user_id on public.credit_cards (user_id);

-- RLS
alter table public.credit_cards enable row level security;

drop policy if exists "Users can view own credit_cards" on public.credit_cards;
create policy "Users can view own credit_cards"
  on public.credit_cards for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own credit_cards" on public.credit_cards;
create policy "Users can insert own credit_cards"
  on public.credit_cards for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own credit_cards" on public.credit_cards;
create policy "Users can update own credit_cards"
  on public.credit_cards for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own credit_cards" on public.credit_cards;
create policy "Users can delete own credit_cards"
  on public.credit_cards for delete
  using (auth.uid() = user_id);

-- Credit card payments (separate from debt_payments for cleaner tracking)
create table if not exists public.credit_card_payments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users on delete cascade not null,
  card_id uuid references public.credit_cards on delete cascade not null,
  amount bigint not null default 0,
  from_account_id uuid references public.accounts on delete set null,
  date date not null default current_date,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_cc_payments_user_id on public.credit_card_payments (user_id);
create index if not exists idx_cc_payments_card_id on public.credit_card_payments (card_id);

alter table public.credit_card_payments enable row level security;

drop policy if exists "Users can view own cc_payments" on public.credit_card_payments;
create policy "Users can view own cc_payments"
  on public.credit_card_payments for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own cc_payments" on public.credit_card_payments;
create policy "Users can insert own cc_payments"
  on public.credit_card_payments for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own cc_payments" on public.credit_card_payments;
create policy "Users can delete own cc_payments"
  on public.credit_card_payments for delete
  using (auth.uid() = user_id);
