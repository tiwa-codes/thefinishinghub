-- TFH Supabase schema — quote request/response workflow.
--
-- Table + respond_to_quote/decline_quote below match the pre-drafted
-- design at tfh_schema_v6_orders_customers_quotes.sql (confirmed by the
-- user as the intended reference for this prompt) — reproduced here as a
-- real, applied migration, with two real gaps that draft had closed:
-- neither respond_to_quote nor decline_quote had an UPDATE RLS policy to
-- actually run against (both are security invoker, so without one the
-- update inside each function would silently match zero rows and always
-- raise "not found", regardless of who called it). accept_quote is new —
-- the draft explicitly deferred it to "the accompanying prompt".

-- ============================================================
-- QUOTE_REQUESTS
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
-- staff-controlled field at insert time — mirrors create_order's own
-- "server computes what matters, client only supplies contact details"
-- boundary.
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

-- Staff sets price/notes via respond_to_quote — broad "for all" shape,
-- same trust level as staff's product/category access (staff_admin_
-- foundation.sql). respond_to_quote's own WHERE clause (status =
-- 'pending') is the real workflow guard, not this policy.
create policy "staff respond to quote requests"
  on quote_requests for update
  using (exists (select 1 from staff where staff.id = auth.uid()))
  with check (exists (select 1 from staff where staff.id = auth.uid()));

-- Customer accepts/declines their OWN quoted request. Scoped both ways:
-- USING requires the row currently be 'quoted' (owned by them), WITH
-- CHECK requires the new status be 'accepted' or 'declined' — so this
-- policy can only ever be used to END the 'quoted' state, never to
-- re-enter or hold it. That's what keeps quoted_price_kobo trustworthy
-- for accept_quote below: the only way a customer's own update can touch
-- this row at all is one that permanently retires it from 'quoted',
-- so there's no path where a customer edits the row and then still has
-- a 'quoted' row left for accept_quote's own "where status = 'quoted'"
-- guard to act on with a tampered price.
create policy "customers accept or decline their own quoted request"
  on quote_requests for update
  using (auth.uid() = user_id and status = 'quoted')
  with check (auth.uid() = user_id and status in ('accepted', 'declined'));

-- ============================================================
-- RESPOND_TO_QUOTE — staff sets the price, pending -> quoted.
-- Atomic and validated per the prompt: the WHERE clause only matches a
-- still-pending row, and "if not found" turns a second response (or a
-- response to something already quoted/accepted/declined) into a real,
-- catchable error rather than a silent no-op.
-- ============================================================
create or replace function respond_to_quote(
  p_quote_request_id uuid,
  p_price_kobo integer,
  p_notes text
)
returns void
security invoker
set search_path = public
language plpgsql
as $$
begin
  if not exists (select 1 from staff where staff.id = auth.uid()) then
    raise exception 'NOT_AUTHORIZED';
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
    raise exception 'QUOTE_NOT_PENDING';
  end if;
end;
$$;

grant execute on function respond_to_quote(uuid, integer, text) to authenticated;

-- ============================================================
-- DECLINE_QUOTE — customer declines a quoted request.
-- ============================================================
create or replace function decline_quote(p_quote_request_id uuid)
returns void
security invoker
set search_path = public
language plpgsql
as $$
begin
  update quote_requests
  set status = 'declined', responded_at = now()
  where id = p_quote_request_id
    and user_id = auth.uid()
    and status = 'quoted';

  if not found then
    raise exception 'QUOTE_NOT_QUOTED';
  end if;
end;
$$;

grant execute on function decline_quote(uuid) to authenticated;

-- ============================================================
-- ACCEPT_QUOTE — reuses create_order's own order-number generation and
-- order-creation conventions exactly (same format, same snapshot
-- pattern, same status/subtotal/total shape), rather than a second,
-- possibly-inconsistent implementation. security invoker for the same
-- reason as create_order: runs under the calling customer's own
-- privileges, so orders/order_items' existing "users create their own"
-- INSERT policies (customer_checkout.sql) still apply as-is — no new
-- INSERT policy needed here.
--
-- email is NOT a parameter — pulled from the caller's own JWT
-- (auth.jwt()->>'email'), same reasoning the prompt gives for why
-- name/phone/address must be re-collected here but email doesn't: a
-- confirmed account's email is the one reliable thing to inherit.
--
-- Price comes from quoted_price_kobo on a row this function itself
-- requires still be 'quoted' — never from the client, and (per the
-- "customers accept or decline" policy comment above) never tamperable
-- while still in that state either.
-- ============================================================
create or replace function accept_quote(
  p_quote_request_id uuid,
  p_customer_name text,
  p_customer_phone text,
  p_shipping_address jsonb
)
returns orders
security invoker
set search_path = public
language plpgsql
as $$
declare
  v_quote quote_requests;
  v_product products;
  v_variant product_variants;
  v_order orders;
  v_order_number text;
  v_customer_email text;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_quote
  from quote_requests
  where id = p_quote_request_id
    and user_id = auth.uid()
    and status = 'quoted';

  if not found then
    raise exception 'QUOTE_NOT_QUOTED';
  end if;

  v_customer_email := auth.jwt() ->> 'email';
  if v_customer_email is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  select * into v_product from products where id = v_quote.product_id;

  if v_quote.variant_id is not null then
    select * into v_variant from product_variants where id = v_quote.variant_id;
  end if;

  v_order_number :=
    'TFH-' || to_char(now(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into orders (
    order_number, user_id, customer_name, customer_email, customer_phone,
    shipping_address, status, subtotal_kobo, total_kobo
  ) values (
    v_order_number, auth.uid(), p_customer_name, v_customer_email, p_customer_phone,
    p_shipping_address, 'pending_payment', v_quote.quoted_price_kobo, v_quote.quoted_price_kobo
  )
  returning * into v_order;

  insert into order_items (
    order_id, variant_id, product_name_snapshot, variant_label_snapshot,
    unit_price_kobo, quantity
  ) values (
    v_order.id,
    v_quote.variant_id,
    v_product.name,
    nullif(concat_ws(' · ', v_variant.finish, v_variant.color, v_variant.size), ''),
    v_quote.quoted_price_kobo,
    1
  );

  update quote_requests
  set status = 'accepted', responded_at = now(), order_id = v_order.id
  where id = v_quote.id;

  return v_order;
end;
$$;

grant execute on function accept_quote(uuid, text, text, jsonb) to authenticated;
