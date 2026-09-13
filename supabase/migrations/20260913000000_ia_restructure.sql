-- IA restructure: remove unused Bespoke category, rename Sanitarywares
-- subcategories to their final names/slugs, add a nullable tier column
-- to products. See CLAUDE.md for the locked category structure.

-- 3a. Pre-flight check (run manually, not enforced here): confirmed via
--     `SELECT COUNT(*) FROM products p JOIN categories c ON p.category_id = c.id
--      WHERE c.slug = 'furniture-bespoke';` -> 0 rows on 2026-09-13.

-- 3b. Delete the (already-unused, already-deleted-in-20260816090000) Bespoke
--     category. No-op today; kept for idempotency/documentation.
delete from categories where slug = 'furniture-bespoke';

-- 3c. Rename the existing Bath/Shower/Toilet subcategories under
--     Sanitarywares & Bath Accessories (slug 'sanitaryware-bath') to their
--     final names/slugs, rather than inserting duplicates.
update categories set name = 'Showers & Panels', slug = 'showers-panels'
  where slug = 'sanitaryware-shower';

update categories set name = 'Baths & Jacuzzis', slug = 'baths-jacuzzis'
  where slug = 'sanitaryware-bathtub';

update categories set name = 'Toilets & Bidets', slug = 'toilets-bidets'
  where slug = 'sanitaryware-toilet';

-- 3d. Add nullable free-text tier column to products.
alter table products
  add column if not exists tier text;

-- 3e. No schema change: product_variants.finish is already free-text.
--     Confirmed via information_schema.columns -> data_type = 'text'.
