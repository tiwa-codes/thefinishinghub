ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_bestseller boolean NOT NULL DEFAULT false;

UPDATE products SET is_bestseller = true
WHERE slug IN ('positano-sofa', 'geneva-wingback-chair');
