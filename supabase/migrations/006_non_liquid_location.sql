-- ============================================
-- Add location (lat/lng/address) to non-liquid assets
-- ============================================

alter table public.assets_non_liquid
  add column if not exists latitude  numeric,
  add column if not exists longitude numeric,
  add column if not exists address   text not null default '';
