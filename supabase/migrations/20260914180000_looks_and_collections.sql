CREATE TABLE looks (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  slug          text UNIQUE NOT NULL,
  description   text,
  image_url     text NOT NULL,
  style_id      uuid REFERENCES styles(id),
  display_order integer NOT NULL DEFAULT 0,
  is_featured   boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE look_products (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  look_id       uuid NOT NULL REFERENCES looks(id) ON DELETE CASCADE,
  product_id    uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0
);

ALTER TABLE looks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "looks_public_read" ON looks FOR SELECT USING (true);
ALTER TABLE look_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "look_products_public_read" ON look_products FOR SELECT
  USING (true);

CREATE TABLE collections (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  description   text,
  image_url     text NOT NULL,
  display_order integer NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "collections_public_read" ON collections FOR SELECT
  USING (true);

-- Seed — 4 looks. Every image id below was verified with a direct fetch
-- (HTTP 200 + visual check) before being written here.
--
-- kano-bed and asaba-bed (named in the task for Look 3) don't exist in
-- this catalog — the two real bed products are milano-wingback-bed and
-- provence-upholstered-storage-bed. Using milano-wingback-bed: "Wingback"
-- reads closer to the grand/villa register this look is going for than
-- "storage bed" does.
INSERT INTO looks (title, slug, description, image_url, style_id, display_order, is_featured)
VALUES
  (
    'The Grand Salon',
    'the-grand-salon',
    'A living room that commands the room. Dark carved wood, gold accents, and upholstery chosen for presence.',
    'https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?w=1200&q=80&auto=format&fit=crop',
    (SELECT id FROM styles WHERE slug = 'villa'),
    1,
    true
  ),
  (
    'Clean Lines, Considered Living',
    'clean-lines-considered-living',
    'Minimal forms, natural textures, and a palette that lets the materials do the talking.',
    'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&q=80&auto=format&fit=crop',
    (SELECT id FROM styles WHERE slug = 'contemporary'),
    2,
    true
  ),
  (
    'The Presidential Suite',
    'the-presidential-suite',
    'Sleep like you''ve arrived. A bedroom that sets the tone for the entire house.',
    'https://images.unsplash.com/photo-1505692952047-1a78307da8f2?w=1200&q=80&auto=format&fit=crop',
    (SELECT id FROM styles WHERE slug = 'villa'),
    3,
    true
  ),
  (
    'Where Focus Lives',
    'where-focus-lives',
    'A workspace that earns its place in the home.',
    'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&q=80&auto=format&fit=crop',
    (SELECT id FROM styles WHERE slug = 'contemporary'),
    4,
    false
  );

INSERT INTO look_products (look_id, product_id, display_order)
VALUES
  ((SELECT id FROM looks WHERE slug = 'the-grand-salon'), (SELECT id FROM products WHERE slug = 'positano-sofa'), 1),
  ((SELECT id FROM looks WHERE slug = 'the-grand-salon'), (SELECT id FROM products WHERE slug = 'positano-accent-chair'), 2),

  ((SELECT id FROM looks WHERE slug = 'clean-lines-considered-living'), (SELECT id FROM products WHERE slug = 'positano-loveseat'), 1),
  ((SELECT id FROM looks WHERE slug = 'clean-lines-considered-living'), (SELECT id FROM products WHERE slug = 'positano-accent-chair'), 2),

  ((SELECT id FROM looks WHERE slug = 'the-presidential-suite'), (SELECT id FROM products WHERE slug = 'milano-wingback-bed'), 1),

  ((SELECT id FROM looks WHERE slug = 'where-focus-lives'), (SELECT id FROM products WHERE slug = 'geneva-wingback-chair'), 1);

-- Seed — 2 collections
INSERT INTO collections (name, slug, description, image_url, display_order)
VALUES
  (
    'Positano Collection',
    'positano-collection',
    'The Positano line brings the warmth of the Italian coast into the living room. Waterfall arms, brass-finished trim, and upholstery that holds its shape.',
    'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80&auto=format&fit=crop',
    1
  ),
  (
    'Geneva Collection',
    'geneva-collection',
    'The Geneva pieces are defined by their structure — exposed frames, tailored upholstery, and proportions that work in any room.',
    'https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80&auto=format&fit=crop',
    2
  );
