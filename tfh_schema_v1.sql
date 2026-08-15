-- TFH Supabase schema — v1
-- Scope: product catalog (with variants) + guest cart + skeleton orders.
-- Explicitly NOT included yet: trade-tier pricing (needs trade_accounts +
-- auth model that doesn't exist), admin/POS-specific tables.
-- Money stored as integer kobo (₦ x 100) to avoid float rounding errors.

create extension if not exists "pgcrypto";

-- ============================================================
-- CATEGORIES (self-referencing: top-level nav item -> subcategory)
-- e.g. Furniture -> Living Room / Dining / Bedroom / Workspace / Bespoke
-- ============================================================
create table categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  parent_id uuid references categories(id) on delete cascade,
  display_order int not null default 0,
  created_at timestamptz not null default now()
);

create index categories_parent_id_idx on categories(parent_id);

-- ============================================================
-- PRODUCTS
-- ============================================================
create table products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id uuid not null references categories(id),
  description text,
  short_description text,
  -- Replaces stock-count badges per the "In Showroom" UI decision.
  is_showroom_display boolean not null default false,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index products_category_id_idx on products(category_id);
create index products_status_idx on products(status);

-- ============================================================
-- PRODUCT VARIANTS (finish / color / size — each its own SKU + price)
-- Every product has >=1 variant. Simple products get exactly one,
-- flagged is_default, so PDP/listing code never has to special-case
-- "does this product have variants."
-- ============================================================
create table product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  sku text not null unique,
  finish text,
  color text,
  size text,
  price_kobo integer not null check (price_kobo >= 0),
  is_default boolean not null default false,
  in_stock boolean not null default true,
  created_at timestamptz not null default now()
);

create index product_variants_product_id_idx on product_variants(product_id);

-- Enforce exactly one default variant per product
create unique index one_default_variant_per_product
  on product_variants(product_id) where is_default;

-- ============================================================
-- PRODUCT IMAGES (gallery; optionally overridden per variant,
-- e.g. a color swatch showing that specific finish)
-- ============================================================
create table product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete cascade,
  url text not null,
  alt_text text,
  display_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create index product_images_product_id_idx on product_images(product_id);

-- ============================================================
-- CART ITEMS — guest cart via Supabase anonymous auth.
-- Every visitor gets a real auth.uid() via supabase.auth.signInAnonymously(),
-- no separate session_id column needed. Converts cleanly to a permanent
-- account later without a manual cart-merge migration.
-- ============================================================
create table cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  variant_id uuid not null references product_variants(id),
  quantity int not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, variant_id)
);

create index cart_items_user_id_idx on cart_items(user_id);

-- ============================================================
-- ORDERS — deliberately skeletal. Checkout/payment flow isn't designed
-- yet, so nullable where the real shape is still unknown. Inserts happen
-- server-side (service role) once payment verification exists — no
-- public insert policy is granted here.
-- ============================================================
create table orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  user_id uuid references auth.users(id),
  customer_name text not null,
  customer_email text not null,
  customer_phone text not null,
  shipping_address jsonb,
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'paid', 'fulfilled', 'cancelled')),
  subtotal_kobo integer not null,
  total_kobo integer not null,
  payment_provider text check (payment_provider in ('paystack', 'flutterwave')),
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index orders_user_id_idx on orders(user_id);

-- Snapshot product name/price at time of purchase — order history must
-- not silently change if a product is later renamed, repriced, or deleted.
create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  variant_id uuid references product_variants(id) on delete set null,
  product_name_snapshot text not null,
  variant_label_snapshot text,
  unit_price_kobo integer not null,
  quantity int not null check (quantity > 0),
  created_at timestamptz not null default now()
);

create index order_items_order_id_idx on order_items(order_id);

-- ============================================================
-- updated_at trigger
-- ============================================================
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger products_set_updated_at
  before update on products
  for each row execute function set_updated_at();

create trigger cart_items_set_updated_at
  before update on cart_items
  for each row execute function set_updated_at();

create trigger orders_set_updated_at
  before update on orders
  for each row execute function set_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table categories enable row level security;
alter table products enable row level security;
alter table product_variants enable row level security;
alter table product_images enable row level security;
alter table cart_items enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Catalog: public read, published only
create policy "categories are publicly readable"
  on categories for select using (true);

create policy "published products are publicly readable"
  on products for select using (status = 'published');

create policy "variants of published products are publicly readable"
  on product_variants for select using (
    exists (
      select 1 from products
      where products.id = product_variants.product_id
        and products.status = 'published'
    )
  );

create policy "images of published products are publicly readable"
  on product_images for select using (
    exists (
      select 1 from products
      where products.id = product_images.product_id
        and products.status = 'published'
    )
  );

-- Cart: only the owning user (anonymous or permanent) can read/write their own rows
create policy "users manage their own cart items"
  on cart_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Orders: read-only from the client, scoped to the owning user.
-- No insert/update policy — writes happen server-side once checkout ships.
create policy "users read their own orders"
  on orders for select using (auth.uid() = user_id);

create policy "users read their own order items"
  on order_items for select using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );
