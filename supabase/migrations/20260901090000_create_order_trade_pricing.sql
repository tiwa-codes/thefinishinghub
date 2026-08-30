-- create_order: read prices through public_product_variants, not
-- product_variants directly. That view already computes trade-discounted
-- pricing via a security-invoker-equivalent auth.uid()-scoped join
-- against trade_accounts (proven correct — see
-- scripts/check-trade-pricing-rls.mjs) and already nulls price_kobo for
-- requires_quote products — so reading through it here makes order
-- totals automatically discount-aware for free, with no separate
-- discount lookup/logic duplicated into this function.
--
-- Only the two places that actually READ pv.price_kobo change (the
-- subtotal sum, and the order_items snapshot insert). The requires_quote
-- gate above them is untouched — it's a boolean check, not a price read,
-- and by the time either changed query runs, CART_HAS_QUOTE_ITEMS has
-- already guaranteed no requires_quote item is present, so
-- public_product_variants' null price_kobo for those never actually
-- reaches sum()/the snapshot here in practice.
create or replace function create_order(
  p_customer_name text,
  p_customer_email text,
  p_customer_phone text,
  p_shipping_address jsonb
)
returns orders
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_order orders;
  v_subtotal integer;
  v_order_number text;
  v_quote_item_count integer;
  v_item_count integer;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'ANONYMOUS_CHECKOUT_BLOCKED';
  end if;

  select count(*) into v_quote_item_count
  from cart_items ci
  join product_variants pv on pv.id = ci.variant_id
  join products p on p.id = pv.product_id
  where ci.user_id = auth.uid() and p.requires_quote;

  if v_quote_item_count > 0 then
    raise exception 'CART_HAS_QUOTE_ITEMS';
  end if;

  select count(*), coalesce(sum(pv.price_kobo * ci.quantity), 0)
    into v_item_count, v_subtotal
  from cart_items ci
  join public_product_variants pv on pv.id = ci.variant_id
  where ci.user_id = auth.uid();

  if v_item_count = 0 then
    raise exception 'CART_EMPTY';
  end if;

  v_order_number :=
    'TFH-' || to_char(now(), 'YYYYMMDD') || '-' ||
    upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  insert into orders (
    order_number, user_id, customer_name, customer_email, customer_phone,
    shipping_address, status, subtotal_kobo, total_kobo
  ) values (
    v_order_number, auth.uid(), p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, 'pending_payment', v_subtotal, v_subtotal
  )
  returning * into v_order;

  insert into order_items (
    order_id, variant_id, product_name_snapshot, variant_label_snapshot,
    unit_price_kobo, quantity
  )
  select
    v_order.id,
    pv.id,
    prod.name,
    nullif(concat_ws(' · ', pv.finish, pv.color, pv.size), ''),
    pv.price_kobo,
    ci.quantity
  from cart_items ci
  join public_product_variants pv on pv.id = ci.variant_id
  join products prod on prod.id = pv.product_id
  where ci.user_id = auth.uid();

  return v_order;
end;
$$;
