-- accept_quote follow-up: explicit anonymous-session guard, matching
-- create_order's own convention exactly (auth.jwt()->>'is_anonymous'),
-- instead of relying on an anonymous session's email claim happening to
-- be null/empty. An anonymous visitor's JWT was observed with
-- "email":"" (empty string, not null) during Stage 1 verification —
-- the original "email is null" check here would not have caught that.
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

  if coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'ANONYMOUS_CHECKOUT_BLOCKED';
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
  if v_customer_email is null or v_customer_email = '' then
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
