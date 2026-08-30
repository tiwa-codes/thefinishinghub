-- Trade accounts: self-applied, staff-approved, tier + negotiated
-- discount. Same "customer can't self-approve" pattern as elsewhere
-- in this schema — status/tier/discount_percent/approved fields are
-- all null-required at insert time, only staff can set them via update.

create table trade_accounts (
  id uuid primary key references auth.users(id) on delete cascade,
  business_name text not null,
  tier_requested text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  tier text check (tier in ('standard', 'preferred', 'contractor', 'bulk')),
  discount_percent numeric(5,2)
    check (discount_percent is null or (discount_percent >= 0 and discount_percent <= 100)),
  applied_at timestamptz not null default now(),
  approved_at timestamptz,
  approved_by uuid references staff(id),
  created_at timestamptz not null default now()
);

alter table trade_accounts enable row level security;

create policy "customers apply for trade pricing"
  on trade_accounts for insert
  with check (
    auth.uid() = id
    and status = 'pending'
    and tier is null
    and discount_percent is null
    and approved_at is null
    and approved_by is null
  );

create policy "customers read own trade account"
  on trade_accounts for select using (auth.uid() = id);

create policy "staff read all trade accounts"
  on trade_accounts for select
  using (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff manage trade accounts"
  on trade_accounts for update
  using (exists (select 1 from staff where staff.id = auth.uid()))
  with check (exists (select 1 from staff where staff.id = auth.uid()));

-- Extend the existing public_product_variants view with trade-aware
-- pricing. Preserve the exact existing column order (id, product_id,
-- sku, finish, color, size, in_stock, is_default, created_at,
-- price_kobo, requires_quote) and only append is_trade_price at the
-- end, so this stays a CREATE OR REPLACE rather than a drop/recreate.
-- requires_quote still wins over any discount — a quote-required item
-- stays null regardless of trade status.

create or replace view public_product_variants as
select
  pv.id,
  pv.product_id,
  pv.sku,
  pv.finish,
  pv.color,
  pv.size,
  pv.in_stock,
  pv.is_default,
  pv.created_at,
  case
    when p.requires_quote then null
    when ta.status = 'approved'
      then round(pv.price_kobo * (1 - ta.discount_percent / 100.0))::integer
    else pv.price_kobo
  end as price_kobo,
  p.requires_quote,
  (ta.status = 'approved') as is_trade_price
from product_variants pv
join products p on p.id = pv.product_id
left join trade_accounts ta on ta.id = auth.uid() and ta.status = 'approved'
where p.status = 'published';
