-- TFH seed data — v1
-- Seeds the 4 "New Arrivals" products the homepage now queries live, plus
-- the minimal categories needed to satisfy products.category_id (not null).
-- Scope is intentionally narrow: this does NOT seed the full 5-category /
-- subcategory tree — Shop by Room and Shop by Category on the homepage
-- still read from static home-data.ts and weren't part of this migration.
--
-- Run this the same way you ran tfh_schema_v1.sql (Supabase dashboard ->
-- SQL Editor). Not idempotent — run once against a fresh schema.

-- ============================================================
-- CATEGORIES
-- ============================================================
insert into categories (slug, name, parent_id, display_order) values
  ('furniture', 'Furniture & Furnishings', null, 1),
  ('lighting', 'Lighting & Automation', null, 3),
  ('tiles-wall-finishes', 'Tiles & Wall Finishes', null, 2);

insert into categories (slug, name, parent_id, display_order)
select 'furniture-bedroom', 'Bedroom', id, 1
from categories where slug = 'furniture';

-- ============================================================
-- PRODUCTS
-- ============================================================
insert into products (slug, name, category_id, short_description, is_showroom_display, status) values
  (
    'kano-upholstered-storage-bed',
    'Kano Upholstered Storage Bed',
    (select id from categories where slug = 'furniture-bedroom'),
    'Faux leather, gas-lift storage',
    true,
    'published'
  ),
  (
    'asaba-wingback-bed',
    'Asaba Wingback Bed',
    (select id from categories where slug = 'furniture-bedroom'),
    'Channel-tufted headboard',
    true,
    'published'
  ),
  (
    'gudu-brass-pendant',
    'Gudu Brass Pendant',
    (select id from categories where slug = 'lighting'),
    'Aged brass, dimmable',
    false,
    'published'
  ),
  (
    'carrara-porcelain-60x120',
    'Carrara Porcelain, 60×120',
    (select id from categories where slug = 'tiles-wall-finishes'),
    'Matt, per m²',
    false,
    'published'
  );

-- ============================================================
-- PRODUCT VARIANTS (one default variant each — none of these have
-- finish/color/size options yet, so "From ₦X" pricing isn't honest until
-- a second variant actually exists)
-- ============================================================
insert into product_variants (product_id, sku, price_kobo, is_default, in_stock) values
  (
    (select id from products where slug = 'kano-upholstered-storage-bed'),
    'BED-KANO-TAUPE-STD', 54000000, true, true
  ),
  (
    (select id from products where slug = 'asaba-wingback-bed'),
    'BED-ASABA-GREY-STD', 61000000, true, true
  ),
  (
    (select id from products where slug = 'gudu-brass-pendant'),
    'LGT-GUDU-BRASS-STD', 14500000, true, true
  ),
  (
    (select id from products where slug = 'carrara-porcelain-60x120'),
    'TILE-CARRARA-60X120-M2', 1850000, true, true
  );

-- ============================================================
-- PRODUCT IMAGES — only the two beds have real photography
-- (public/images/bed-taupe.jpg, bed-grey-wing.jpg). The pendant and tile
-- deliberately get no row here, so the homepage falls back to its
-- placeholder block, same as before.
-- ============================================================
insert into product_images (product_id, url, alt_text, is_primary) values
  (
    (select id from products where slug = 'kano-upholstered-storage-bed'),
    '/images/bed-taupe.jpg',
    'Kano Upholstered Storage Bed',
    true
  ),
  (
    (select id from products where slug = 'asaba-wingback-bed'),
    '/images/bed-grey-wing.jpg',
    'Asaba Wingback Bed',
    true
  );
