-- TFH Supabase schema — v3
-- Staff auth foundation. Before this migration, nothing could write to
-- the catalog through the client — every product exists via migrations
-- run with elevated access. This is the first time client-side writes
-- to products/categories/variants/images become possible at all, so the
-- policies below are the actual security boundary for the catalog going
-- forward, not a formality.

-- ============================================================
-- STAFF
-- No public insert/signup policy on this table anywhere. Staff rows are
-- created manually: create the auth user via the Supabase dashboard,
-- then insert their row here by hand (see deployment notes).
-- ============================================================
create table staff (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin' check (role in ('admin')),
  created_at timestamptz not null default now()
);

alter table staff enable row level security;

-- A staff member can read their own row (e.g. to show their name in the
-- admin UI). No general "staff can read all staff" policy yet — not
-- needed until there's a reason to list other staff members.
create policy "staff read own row"
  on staff for select using (auth.uid() = id);

-- ============================================================
-- CATALOG WRITE ACCESS — staff only
-- Existing public SELECT policies (published products, etc.) are
-- untouched and still apply. These add write access on top, gated on
-- staff membership. "for all" covers select/insert/update/delete; the
-- public read policies from v1 still apply to select in parallel, so
-- staff also implicitly get to see draft/unpublished products.
-- ============================================================
create policy "staff manage categories"
  on categories for all
  using (exists (select 1 from staff where staff.id = auth.uid()))
  with check (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff manage products"
  on products for all
  using (exists (select 1 from staff where staff.id = auth.uid()))
  with check (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff manage product variants"
  on product_variants for all
  using (exists (select 1 from staff where staff.id = auth.uid()))
  with check (exists (select 1 from staff where staff.id = auth.uid()));

create policy "staff manage product images"
  on product_images for all
  using (exists (select 1 from staff where staff.id = auth.uid()))
  with check (exists (select 1 from staff where staff.id = auth.uid()));

-- ============================================================
-- STORAGE — product image uploads
-- Public read (product photos are public-facing), staff-only write.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "public read product images"
  on storage.objects for select
  using (bucket_id = 'product-images');

create policy "staff upload product images"
  on storage.objects for insert
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from staff where staff.id = auth.uid())
  );

create policy "staff update product images in storage"
  on storage.objects for update
  using (
    bucket_id = 'product-images'
    and exists (select 1 from staff where staff.id = auth.uid())
  )
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from staff where staff.id = auth.uid())
  );

create policy "staff delete product images in storage"
  on storage.objects for delete
  using (
    bucket_id = 'product-images'
    and exists (select 1 from staff where staff.id = auth.uid())
  );
