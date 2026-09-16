-- Category-specific filter attributes per product (e.g. tile Type/Look/
-- Material/Finish, sanitaryware Material/Finish/Trap type). Freeform jsonb
-- since the shape varies by category — the subcategory listing page's
-- attribute filters only show a filter for whichever keys actually appear
-- in the current product set.
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS attributes jsonb;

UPDATE products SET attributes = '{
  "type": "Floor",
  "space": ["Bathroom", "Living Room"],
  "look": "Marble",
  "material": "Porcelain",
  "finish": "Polished"
}'::jsonb
WHERE slug = 'carrara-porcelain-60x120';
