-- TFH Supabase schema — v6
-- Order management (staff visibility + status updates), a derived
-- customer records view, and the quote request/response workflow.

-- ============================================================
-- ORDER MANAGEMENT — staff visibility + status updates
-- Existing "users read their own orders" policy is untouched; these
-- add staff access on top (multiple permissive policies OR together).
-- ============================================================
create policy "staff view all orders"
  on orders for select
  using (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff update orders"
  on orders for update
  using (exists (select 1 from staff where staff.id = auth.uid()))
  with check (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff view all order items"
  on order_items for select
  using (exists (select 1 from staff where staff.id = auth.uid()));

-- ============================================================
-- CUSTOMER RECORDS — derived from orders, not a new PII store.
-- security_invoker = true is essential here: without it, this view
-- would run with the owner's privileges and bypass orders' RLS
-- entirely, leaking every customer's contact info and spend to
-- anyone with select on the view. With it, a staff caller sees
-- everyone (via the staff policy above), a regular customer would
-- only ever see their own row (harmless, just not useful to them).
-- ============================================================
create view customer_summary
with (security_invoker = true) as
with latest as (
  select distinct on (customer_email)
    customer_email, customer_name, customer_phone
  from orders
  order by customer_email, created_at desc
),
agg as (
  select
    customer_email,
    count(*) as order_count,
    sum(total_kobo) filter (where status in ('paid', 'fulfilled')) as lifetime_value_kobo,
    max(created_at) as last_order_at
  from orders
  group by customer_email
)
select
  l.customer_email,
  l.customer_name,
  l.customer_phone,
  a.order_count,
  coalesce(a.lifetime_value_kobo, 0) as lifetime_value_kobo,
  a.last_order_at
from latest l
join agg a using (customer_email);

grant select on customer_summary to authenticated;

-- ============================================================
-- QUOTE REQUESTS
-- ============================================================
create table quote_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references products(id),
  variant_id uuid references product_variants(id),
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'quoted', 'accepted', 'declined')),
  quoted_price_kobo integer check (quoted_price_kobo is null or quoted_price_kobo >= 0),
  quoted_notes text,
  quoted_by uuid references staff(id),
  quoted_at timestamptz,
  responded_at timestamptz,
  order_id uuid references orders(id),
  created_at timestamptz not null default now()
);

alter table quote_requests enable row level security;

-- Customer creates their own pending request. Cannot set any
-- staff-controlled field at insert time — mirrors the trade_accounts
-- "can't self-approve" pattern.
create policy "customers request a quote"
  on quote_requests for insert
  with check (
    auth.uid() = user_id
    and status = 'pending'
    and quoted_price_kobo is null
    and quoted_by is null
    and quoted_at is null
    and order_id is null
  );

create policy "customers read own quote requests"
  on quote_requests for select
  using (auth.uid() = user_id);

create policy "staff read all quote requests"
  on quote_requests for select
  using (exists (select 1 from staff where staff.id = auth.uid()));

-- Staff responds: sets price/notes, flips pending -> quoted.
create or replace function respond_to_quote(
  p_quote_request_id uuid,
  p_price_kobo integer,
  p_notes text
)
returns void
security invoker
language plpgsql
as $$
begin
  if not exists (select 1 from staff where staff.id = auth.uid()) then
    raise exception 'not authorized';
  end if;

  update quote_requests
  set status = 'quoted',
      quoted_price_kobo = p_price_kobo,
      quoted_notes = p_notes,
      quoted_by = auth.uid(),
      quoted_at = now()
  where id = p_quote_request_id
    and status = 'pending';

  if not found then
    raise exception 'quote request not found or not pending';
  end if;
end;
$$;

-- Customer declines a quoted request.
create or replace function decline_quote(p_quote_request_id uuid)
returns void
security invoker
language plpgsql
as $$
begin
  update quote_requests
  set status = 'declined', responded_at = now()
  where id = p_quote_request_id
    and user_id = auth.uid()
    and status = 'quoted';

  if not found then
    raise exception 'quote not found, not yours, or not in quoted status';
  end if;
end;
$$;

-- accept_quote is intentionally NOT defined here — it needs to reuse
-- whatever order-number generation and order-creation conventions
-- create_order already established, rather than a second, possibly
-- inconsistent implementation guessed from outside the codebase.
-- Contract is specified in the accompanying prompt.
