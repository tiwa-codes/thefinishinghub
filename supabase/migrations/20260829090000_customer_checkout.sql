-- TFH schema — customer checkout (Stage 1: accounts + order creation,
-- no payment yet — that's Stage 2).
--
-- Orders/order_items had SELECT-only policies until now (v1's comment:
-- "writes happen server-side once checkout ships"). This is that: real
-- INSERT policies scoped to the owning customer, plus a create_order RPC
-- that computes subtotal_kobo/total_kobo itself from live cart_items +
-- product_variants — the client passes contact/delivery details only,
-- never a total. That's the actual security boundary a raw client call
-- can't get around, not just something the checkout form happens not to
-- send.

-- ============================================================
-- ORDERS / ORDER_ITEMS — customers can create their own
-- ============================================================
create policy "users create their own orders"
  on orders for insert
  with check (auth.uid() = user_id);

create policy "users create order items for their own orders"
  on order_items for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

-- ============================================================
-- CREATE_ORDER
-- security invoker (same reasoning as add_to_cart): runs with the
-- calling customer's own privileges, so the policies above still apply
-- exactly as if the client had issued the inserts itself — no privilege
-- escalation, and price/total come from a live join the client has no
-- way to influence, regardless of what it passes in.
--
-- Blocks anonymous sessions (auth.jwt()'s is_anonymous claim) — checkout
-- requires a real account, matching the UI gate, enforced here too so
-- that gate isn't just cosmetic. Also blocks a cart containing any
-- requires_quote item: those aren't fixed-price, self-checkout-able —
-- the customer needs to talk to the showroom for that piece first.
--
-- Does NOT touch cart_items — the cart stays intact until Stage 2 marks
-- the order paid.
-- ============================================================
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
  join product_variants pv on pv.id = ci.variant_id
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
  join product_variants pv on pv.id = ci.variant_id
  join products prod on prod.id = pv.product_id
  where ci.user_id = auth.uid();

  return v_order;
end;
$$;

grant execute on function create_order(text, text, text, jsonb) to authenticated;
