-- TFH schema — v5
-- SiteNav/SiteFooter are becoming data-driven from `categories` instead of
-- hardcoded arrays. CLAUDE.md locks the nav at five top-level categories,
-- but "Doors, Windows & Joinery" was never seeded — only Furniture,
-- Tiles & Wall Finishes, and Lighting & Automation existed, plus
-- Sanitarywares & Bath Accessories added last round. Without this, going
-- fully data-driven would silently drop the nav to 4 items. No
-- subcategories yet — same honest "empty until real data exists"
-- treatment as Tiles & Wall Finishes and Lighting & Automation.

insert into categories (slug, name, parent_id, display_order) values
  ('doors-windows-joinery', 'Doors, Windows & Joinery', null, 5);
