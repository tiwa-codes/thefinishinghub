-- TFH Supabase schema — staff order management + customer_summary.
--
-- Before this migration, orders/order_items had customer-scoped SELECT
-- (v1) and customer-scoped INSERT (customer_checkout) — no staff access
-- at all, despite the admin surface this migration supports assuming
-- staff could already read and update orders. They couldn't; this is
-- that.

-- ============================================================
-- STAFF READ ACCESS — orders / order_items
-- Mirrors the "staff manage X" shape from staff_admin_foundation.sql.
-- ============================================================
create policy "staff read all orders"
  on orders for select
  using (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff read all order items"
  on order_items for select
  using (exists (select 1 from staff where staff.id = auth.uid()));

-- ============================================================
-- STAFF STATUS UPDATES — orders
-- Deliberately narrower than "staff manage X": the with check clause
-- only allows the new status to be 'fulfilled' or 'cancelled'. Staff
-- cannot use this to set status back to 'paid' (or to 'pending_payment')
-- — that transition is confirmPayment()'s alone (src/lib/paystack.ts,
-- service-role, verified against Paystack directly), and nothing about
-- moving an order forward through fulfillment should be able to
-- retroactively fake a payment.
-- ============================================================
create policy "staff update order status"
  on orders for update
  using (exists (select 1 from staff where staff.id = auth.uid()))
  with check (
    exists (select 1 from staff where staff.id = auth.uid())
    and status in ('fulfilled', 'cancelled')
  );

-- ============================================================
-- CUSTOMER_SUMMARY
-- security_invoker (same reasoning as public_product_variants): this
-- view adds no access of its own — it runs with the CALLING role's own
-- privileges, so orders' existing RLS is what actually decides what
-- comes back. A staff session sees every row (the new "staff read all
-- orders" policy above). A real customer session sees only orders where
-- auth.uid() = user_id, so the group-by collapses to at most their own
-- single row — never the full customer list. An anonymous session (every
-- first-time visitor has one) has no matching orders at all, so it's
-- zero rows. That's the actual security boundary, not a separate policy
-- on the view.
--
-- Derived and read-only by design: no admin UI writes here, ever.
-- lifetime_value_kobo counts paid orders only (real revenue, not
-- abandoned/pending carts); order_count counts every order regardless of
-- status (total engagement). customer_name/customer_email come from the
-- most recent order's snapshot — orders has no live link to auth.users.
-- ============================================================
create view customer_summary
  with (security_invoker = true) as
select
  o.user_id,
  (array_agg(o.customer_name order by o.created_at desc))[1] as customer_name,
  (array_agg(o.customer_email order by o.created_at desc))[1] as customer_email,
  count(*) as order_count,
  coalesce(sum(o.total_kobo) filter (where o.status = 'paid'), 0) as lifetime_value_kobo,
  max(o.created_at) as last_order_at
from orders o
where o.user_id is not null
group by o.user_id;

grant select on customer_summary to authenticated;
