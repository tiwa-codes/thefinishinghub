-- TFH Supabase schema — quote-required pricing + Atelier flag
-- Adds:
--   1. products.requires_quote — hides price_kobo from public reads for
--      this product; the public site shows "Request a Quote" (reusing
--      the existing showroom phone/email — no new form/pipeline yet)
--      instead of a price + Add to Cart.
--   2. products.is_atelier — settable now via the admin; deliberately
--      NOT surfaced anywhere on the public site yet (no showcase page
--      until at least one real product is flagged — see GAPS.md).
--   3. public_product_variants — the only variant-price path
--      public-facing code may read from going forward. Nulls price_kobo
--      for any requires_quote product; staff-facing code (admin) keeps
--      reading product_variants directly and is unaffected.
--
-- NOTE: this file was written to match schema already applied directly
-- to the remote database (confirmed via `supabase db dump`) rather than
-- being the migration that created it — reconciled into the ledger via
-- `supabase migration repair --status applied`, same as
-- 20260827090000_staff_admin_foundation.sql was. Kept here so the
-- migration history is an accurate, re-runnable record of the real
-- schema, not because this exact file is what ran.

alter table products
  add column requires_quote boolean not null default false,
  add column is_atelier boolean not null default false;

-- ============================================================
-- PUBLIC_PRODUCT_VARIANTS
-- The actual security boundary lives in this view's SELECT list (the
-- case/when), not in application code — price_kobo is genuinely null in
-- the row PostgREST returns for a quote-required product, regardless of
-- who's asking or what the client does with it.
--
-- The explicit `where p.status = 'published'` does the same job
-- security_invoker would have (preventing draft-product variants from
-- leaking to anonymous callers), without depending on RLS pass-through —
-- this view is owned by postgres and does not set security_invoker, so
-- it does NOT re-check RLS as the querying role; the published-only
-- filter is what keeps that safe on its own.
-- ============================================================
create view public_product_variants as
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
  case when p.requires_quote then null else pv.price_kobo end as price_kobo,
  p.requires_quote
from product_variants pv
join products p on p.id = pv.product_id
where p.status = 'published';

-- Matches what's actually live (Supabase dashboard-created views default
-- to GRANT ALL, same as the staff table) rather than the narrower GRANT
-- SELECT this would ideally be — INSERT/UPDATE/DELETE aren't actually
-- usable against this view (it joins two tables), so it's not a real
-- write hole, but noting the discrepancy rather than silently writing
-- a "cleaner" grant than what's really there.
grant all on public_product_variants to anon, authenticated, service_role;
