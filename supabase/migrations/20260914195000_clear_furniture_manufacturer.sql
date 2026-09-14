-- NBH is TFH's internal supply arm and should never appear as a
-- customer-facing "manufacturer" on furniture product pages.
UPDATE products SET manufacturer = NULL
WHERE category_id IN (
  SELECT id FROM categories
  WHERE parent_id = (SELECT id FROM categories WHERE slug = 'furniture')
);
