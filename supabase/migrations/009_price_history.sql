-- ============================================
-- Historical price series (weekly closes)
-- Used for Relative Rotation Graph (RRG) and other
-- time-series analytics.
-- Shared cache across users — keyed by (ticker, date).
-- ============================================

create table if not exists public.price_history (
  ticker text not null,
  date date not null,
  close numeric not null,
  interval text not null default '1wk',
  source text not null default 'yahoo-finance',
  fetched_at timestamptz not null default now(),
  primary key (ticker, interval, date)
);

create index if not exists idx_price_history_ticker_date
  on public.price_history (ticker, date desc);

alter table public.price_history enable row level security;

drop policy if exists "Authenticated can read price_history"
  on public.price_history;
create policy "Authenticated can read price_history"
  on public.price_history for select
  to authenticated
  using (true);

drop policy if exists "Service role can upsert price_history"
  on public.price_history;
create policy "Service role can upsert price_history"
  on public.price_history for all
  to service_role
  using (true)
  with check (true);

-- Authenticated users may also write to the shared cache
-- (same pattern used by quote fetches; price_history is not
-- user-specific, just a shared price library keyed by ticker).
drop policy if exists "Authenticated can upsert price_history"
  on public.price_history;
create policy "Authenticated can upsert price_history"
  on public.price_history for insert
  to authenticated
  with check (true);

drop policy if exists "Authenticated can update price_history"
  on public.price_history;
create policy "Authenticated can update price_history"
  on public.price_history for update
  to authenticated
  using (true)
  with check (true);
