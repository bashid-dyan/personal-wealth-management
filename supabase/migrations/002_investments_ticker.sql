-- ============================================
-- Investments — Live Quote Support
-- Adds ticker symbol + price snapshot caching for
-- variable-income investments (stocks, crypto, etc.)
-- ============================================

-- Add ticker & tracking metadata to investments
alter table public.investments
  add column if not exists ticker text,
  add column if not exists currency text not null default 'IDR',
  add column if not exists last_synced_at timestamptz,
  add column if not exists notes text not null default '';

create index if not exists idx_investments_ticker
  on public.investments (ticker)
  where ticker is not null;

-- Cached price snapshots (shared across users per ticker)
create table if not exists public.price_snapshots (
  ticker text primary key,
  price numeric not null,
  currency text not null default 'USD',
  change_pct numeric,
  market_state text,
  fetched_at timestamptz not null default now(),
  source text not null default 'yahoo-finance'
);

create index if not exists idx_price_snapshots_fetched_at
  on public.price_snapshots (fetched_at desc);

-- Anyone authenticated can read the shared cache
alter table public.price_snapshots enable row level security;

drop policy if exists "Authenticated can read price_snapshots"
  on public.price_snapshots;
create policy "Authenticated can read price_snapshots"
  on public.price_snapshots for select
  to authenticated
  using (true);

drop policy if exists "Service role can upsert price_snapshots"
  on public.price_snapshots;
create policy "Service role can upsert price_snapshots"
  on public.price_snapshots for all
  to service_role
  using (true)
  with check (true);
