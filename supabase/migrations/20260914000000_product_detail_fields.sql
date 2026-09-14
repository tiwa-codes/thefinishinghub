ALTER TABLE products
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS warranty_years integer,
  ADD COLUMN IF NOT EXISTS origin text;

-- The literal "category_id = furniture's own id" filter matches 0 rows —
-- products are categorized into furniture's subcategories (Sofas, Beds &
-- Bedroom Sets, etc.), not the top-level umbrella row directly. Matches
-- the parent OR any of its children instead (16 real furniture products
-- as of this migration, not the "4" the task text assumed).
UPDATE products SET warranty_years = 10, origin = 'Italy'
WHERE category_id IN (
  SELECT id FROM categories
  WHERE slug = 'furniture'
     OR parent_id = (SELECT id FROM categories WHERE slug = 'furniture')
);
