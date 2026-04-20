-- ============================================
-- Expand investments.category check constraint
-- Adds: forex, sbn, pension
-- ============================================

alter table public.investments drop constraint if exists investments_category_check;

alter table public.investments add constraint investments_category_check
  check (category in (
    'stock',
    'mutual_fund',
    'crypto',
    'gold',
    'bond',
    'sbn',
    'time_deposit',
    'forex',
    'p2p',
    'pension',
    'business'
  ));
