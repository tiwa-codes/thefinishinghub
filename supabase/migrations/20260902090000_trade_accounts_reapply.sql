-- Lets a rejected trade applicant reapply, using the same
-- security-invoker RPC pattern as respond_to_quote/decline_quote
-- (quote_requests.sql). security invoker means this still runs under the
-- calling customer's own privileges — RLS is fully enforced against
-- them, not bypassed — so, same as respond_to_quote/decline_quote
-- before their own UPDATE policies existed, this needs its own
-- customer-scoped UPDATE policy to have anything to actually match.
-- Without one, the UPDATE below silently touches zero rows regardless of
-- who calls it, and "if not found" turns that into a misleading
-- "no rejected application found" error even for a genuinely rejected
-- caller. This exact gap (RPC written, matching RLS policy forgotten)
-- already happened twice in this schema — see the comment at the top of
-- quote_requests.sql.

create policy "customers reapply after rejection"
  on trade_accounts for update
  using (auth.uid() = id and status = 'rejected')
  with check (
    auth.uid() = id and status = 'pending'
    and tier is null and discount_percent is null
    and approved_at is null and approved_by is null
  );

create or replace function reapply_for_trade_pricing(p_tier_requested text)
returns void
security invoker
set search_path = public
language plpgsql
as $$
begin
  update trade_accounts
  set status = 'pending',
      tier_requested = p_tier_requested,
      tier = null,
      discount_percent = null,
      approved_at = null,
      approved_by = null,
      applied_at = now()
  where id = auth.uid()
    and status = 'rejected';

  if not found then
    raise exception 'no rejected application found to reapply for';
  end if;
end;
$$;

grant execute on function reapply_for_trade_pricing(text) to authenticated;
