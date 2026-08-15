-- TFH schema — v2
-- Replaces the client-side read-then-write cart increment (select, then
-- insert-or-update) with a single atomic upsert. The old pattern had a
-- real race: two near-simultaneous requests for the same (user_id,
-- variant_id) could both read "no existing row" and both insert,
-- violating the unique constraint, or both read the same quantity and
-- both write quantity+1, losing an increment.
--
-- security invoker (not definer) — this function runs with the calling
-- user's own privileges, so the existing RLS policy on cart_items
-- ("auth.uid() = user_id") still applies exactly as if the client had
-- issued the insert/update itself. No privilege escalation.
--
-- Run this the same way as the previous two files (SQL Editor).

create or replace function add_to_cart(p_variant_id uuid, p_quantity int default 1)
returns cart_items
language plpgsql
security invoker
set search_path = public
as $$
declare
  result cart_items;
begin
  insert into cart_items (user_id, variant_id, quantity)
  values (auth.uid(), p_variant_id, p_quantity)
  on conflict (user_id, variant_id)
  do update set quantity = cart_items.quantity + excluded.quantity
  returning * into result;

  return result;
end;
$$;

grant execute on function add_to_cart(uuid, int) to authenticated, anon;
