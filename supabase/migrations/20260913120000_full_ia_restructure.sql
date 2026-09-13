-- Full IA restructure: furniture subcategory overhaul, tiles/lighting/doors/
-- sanitaryware subcategories, three new top-level categories (Kitchens,
-- Outdoor, Decor), and a styles table. See CLAUDE.md (updated alongside
-- this migration) for the new locked 8-category top-level nav.
--
-- All parent lookups use subqueries by slug rather than hardcoded UUIDs —
-- confirmed live slugs (2026-09-13): furniture, tiles-wall-finishes,
-- lighting, sanitaryware-bath, doors-windows-joinery.

-- Step 2: safe deletes — furniture-dining, furniture-workspace,
-- furniture-office all confirmed 0 products via audit.
delete from categories
  where slug in ('furniture-dining', 'furniture-workspace', 'furniture-office');

-- Step 4: rename Bedroom -> Beds & Bedroom Sets, re-tag its two products.
update categories
  set name = 'Beds & Bedroom Sets', slug = 'furniture-beds-bedroom-sets'
  where slug = 'furniture-bedroom';

update products
  set category_id = (select id from categories where slug = 'furniture-beds-bedroom-sets')
  where slug in ('kano-bed', 'asaba-bed');

-- Step 5: new furniture subcategories (Beds & Bedroom Sets already exists).
insert into categories (name, slug, parent_id, display_order)
  select v.name, v.slug, (select id from categories where slug = 'furniture'), v.display_order
  from (values
    ('Sofas', 'furniture-sofas', 1),
    ('Wardrobes & Dressers', 'furniture-wardrobes-dressers', 3),
    ('Dining Tables & Chairs', 'furniture-dining-tables-chairs', 4),
    ('Coffee & Side Tables', 'furniture-coffee-side-tables', 5),
    ('Office Seating', 'furniture-office-seating', 6),
    ('Office Desks & Suites', 'furniture-office-desks-suites', 7),
    ('Conference Tables', 'furniture-conference-tables', 8),
    ('Outdoor Furniture', 'furniture-outdoor', 9),
    ('Accent & Occasional Pieces', 'furniture-accent-occasional', 10)
  ) as v(name, slug, display_order)
  where not exists (select 1 from categories where slug = v.slug);

-- Step 3: reassign the 14 ex-Living-Room products per confirmed mapping.
update products set category_id = (select id from categories where slug = 'furniture-sofas')
  where slug in (
    'florence-sofa', 'monaco-sofa', 'positano-sofa',
    'capri-loveseat', 'florence-loveseat', 'positano-loveseat'
  );

update products set category_id = (select id from categories where slug = 'furniture-accent-occasional')
  where slug in (
    'capri-accent-chair', 'geneva-wingback-chair',
    'positano-accent-chair', 'vienna-slipper-chair'
  );

update products set category_id = (select id from categories where slug = 'furniture-coffee-side-tables')
  where slug in (
    'bordeaux-coffee-table', 'verona-coffee-table',
    'bordeaux-side-table', 'verona-side-table'
  );

-- Living Room is now empty (all 14 products reassigned) — remove it.
delete from categories where slug = 'furniture-living';

-- Step 6: tile subcategories.
insert into categories (name, slug, parent_id, display_order)
  select v.name, v.slug, (select id from categories where slug = 'tiles-wall-finishes'), v.display_order
  from (values
    ('Floor Tiles', 'tiles-floor', 1),
    ('Wall Tiles', 'tiles-wall', 2),
    ('Large Format Tiles', 'tiles-large-format', 3),
    ('Mosaic Tiles', 'tiles-mosaic', 4),
    ('Paving & Pavers', 'tiles-paving-pavers', 5),
    ('Trims & Edging', 'tiles-trims-edging', 6)
  ) as v(name, slug, display_order)
  where not exists (select 1 from categories where slug = v.slug);

-- Step 7: remaining sanitaryware subcategories — insert only what's missing.
insert into categories (name, slug, parent_id, display_order)
  select v.name, v.slug, (select id from categories where slug = 'sanitaryware-bath'), v.display_order
  from (values
    ('Basins & Sinks', 'sanitary-basins-sinks', 4),
    ('Vanities', 'sanitary-vanities', 5),
    ('Bathroom Accessories', 'sanitary-bathroom-accessories', 6),
    ('Faucets & Mixers', 'sanitary-faucets-mixers', 7),
    ('Plumbing Accessories', 'sanitary-plumbing-accessories', 8)
  ) as v(name, slug, display_order)
  where not exists (select 1 from categories where slug = v.slug);

-- Step 8: lighting subcategories.
insert into categories (name, slug, parent_id, display_order)
  select v.name, v.slug, (select id from categories where slug = 'lighting'), v.display_order
  from (values
    ('Indoor Lighting', 'lighting-indoor', 1),
    ('Outdoor Lighting', 'lighting-outdoor', 2),
    ('Chandeliers & Statement Lights', 'lighting-chandeliers', 3),
    ('LED Strip & Mood Lighting', 'lighting-led-strip', 4),
    ('Smart Switches & Automation', 'lighting-smart-switches', 5)
  ) as v(name, slug, display_order)
  where not exists (select 1 from categories where slug = v.slug);

-- Step 9: doors subcategories.
insert into categories (name, slug, parent_id, display_order)
  select v.name, v.slug, (select id from categories where slug = 'doors-windows-joinery'), v.display_order
  from (values
    ('Security Doors', 'doors-security', 1),
    ('Pine Wood Doors', 'doors-pine-wood', 2),
    ('WPC & PVC Doors', 'doors-wpc-pvc', 3),
    ('Glass & Sliding Doors', 'doors-glass-sliding', 4),
    ('Smart Locks & Door Handles', 'doors-smart-locks', 5)
  ) as v(name, slug, display_order)
  where not exists (select 1 from categories where slug = v.slug);

-- Step 10: new top-level categories (CLAUDE.md updated alongside this
-- migration to reflect the 8-category locked nav).
insert into categories (name, slug, parent_id, display_order)
  select v.name, v.slug, null, v.display_order
  from (values
    ('Kitchens', 'kitchens', 6),
    ('Outdoor', 'outdoor', 7),
    ('Decor', 'decor', 8)
  ) as v(name, slug, display_order)
  where not exists (select 1 from categories where slug = v.slug);

insert into categories (name, slug, parent_id, display_order)
  select v.name, v.slug, (select id from categories where slug = 'kitchens'), v.display_order
  from (values
    ('Cabinets & Islands', 'kitchens-cabinets-islands', 1),
    ('Kitchen Faucets & Sinks', 'kitchens-faucets-sinks', 2),
    ('Countertops & Surfaces', 'kitchens-countertops', 3),
    ('Storage & Organizers', 'kitchens-storage', 4)
  ) as v(name, slug, display_order)
  where not exists (select 1 from categories where slug = v.slug);

insert into categories (name, slug, parent_id, display_order)
  select v.name, v.slug, (select id from categories where slug = 'outdoor'), v.display_order
  from (values
    ('Garden Furniture', 'outdoor-garden-furniture', 1),
    ('Outdoor Flooring & Paving', 'outdoor-flooring-paving', 2),
    ('Planters & Pots', 'outdoor-planters-pots', 3),
    ('Water Features & Décor', 'outdoor-water-features', 4),
    ('Garden Lighting', 'outdoor-garden-lighting', 5)
  ) as v(name, slug, display_order)
  where not exists (select 1 from categories where slug = v.slug);

insert into categories (name, slug, parent_id, display_order)
  select v.name, v.slug, (select id from categories where slug = 'decor'), v.display_order
  from (values
    ('Mirrors', 'decor-mirrors', 1),
    ('Rugs', 'decor-rugs', 2),
    ('Wall Décor', 'decor-wall-decor', 3),
    ('Pillows', 'decor-pillows', 4),
    ('Decorative Objects', 'decor-decorative-objects', 5)
  ) as v(name, slug, display_order)
  where not exists (select 1 from categories where slug = v.slug);

-- Step 11: styles table.
create table if not exists styles (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  hero_image_path text,
  display_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table products
  add column if not exists style_id uuid references styles(id);

insert into styles (name, slug, display_order)
  select v.name, v.slug, v.display_order
  from (values
    ('Villa', 'villa', 1),
    ('Contemporary', 'contemporary', 2)
  ) as v(name, slug, display_order)
  where not exists (select 1 from styles where slug = v.slug);

alter table styles enable row level security;

drop policy if exists "styles_public_read" on styles;
create policy "styles_public_read" on styles for select using (true);
