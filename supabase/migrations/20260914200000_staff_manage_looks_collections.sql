-- Staff write access for the Looks/Collections admin pages, matching the
-- "staff manage X" pattern from 20260827090000_staff_admin_foundation.sql.
-- Public read policies from 20260914180000_looks_and_collections.sql are
-- untouched and still apply.
create policy "staff manage looks"
  on looks for all
  using (exists (select 1 from staff where staff.id = auth.uid()))
  with check (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff manage look products"
  on look_products for all
  using (exists (select 1 from staff where staff.id = auth.uid()))
  with check (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff manage collections"
  on collections for all
  using (exists (select 1 from staff where staff.id = auth.uid()))
  with check (exists (select 1 from staff where staff.id = auth.uid()));
