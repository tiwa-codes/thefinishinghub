-- Expands the order status vocabulary from the single terminal
-- "fulfilled" to distinct post-payment fulfilment stages, so the admin
-- orders view can show real delivery progress instead of one catch-all
-- state. No live orders exist yet (checked before writing this), so
-- there's nothing to backfill.
alter table orders drop constraint orders_status_check;
alter table orders add constraint orders_status_check
  check (status in ('pending_payment', 'paid', 'processing', 'shipped', 'delivered', 'cancelled'));

-- Staff status changes now go through a service-role API route
-- (src/app/api/admin/orders/[id]/status/route.ts), which bypasses RLS
-- entirely after its own staff-session check — same trust-boundary
-- reasoning as the staff-invite route. The existing "staff update order
-- status" policy (fulfilled/cancelled only, via the cookie-scoped client)
-- is left in place as defense in depth; it simply won't be exercised by
-- the admin UI anymore.
