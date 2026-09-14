ALTER TABLE products
  ADD COLUMN IF NOT EXISTS dimensions jsonb,
  ADD COLUMN IF NOT EXISTS weight_kg  numeric,
  ADD COLUMN IF NOT EXISTS materials  text,
  ADD COLUMN IF NOT EXISTS care_instructions text,
  ADD COLUMN IF NOT EXISTS lead_time_days integer,
  ADD COLUMN IF NOT EXISTS features   jsonb,
  ADD COLUMN IF NOT EXISTS manufacturer text,
  ADD COLUMN IF NOT EXISTS collection text;

UPDATE products SET
  dimensions        = '{"width_cm": 240, "depth_cm": 92, "height_cm": 83}',
  weight_kg         = 68,
  materials         = 'Solid hardwood frame with sinuous spring suspension. Upholstered in full-grain Italian leather, brass-finished trim details.',
  care_instructions = 'Wipe clean with a soft, dry cloth. Avoid direct sunlight and moisture. Condition leather every 6–12 months with a specialist leather conditioner.',
  lead_time_days    = 21,
  features          = '["Solid hardwood frame", "Full-grain Italian leather upholstery", "Brass-finished trim", "Sinuous spring suspension", "Available in custom finishes on request"]',
  manufacturer      = 'NBH',
  collection        = 'Positano Collection'
WHERE slug IN (
  'positano-sofa', 'positano-loveseat',
  'positano-accent-chair', 'geneva-wingback-chair'
);
