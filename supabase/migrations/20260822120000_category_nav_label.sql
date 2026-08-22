-- TFH schema — v7
-- The primary nav row was overcrowded even at its widest (1440px, the
-- site's own max-w cap) — full category names like "Sanitarywares &
-- Bath Accessories" and "Doors, Windows & Joinery" left the row with
-- zero slack, which is what actually caused the wordmark-overlap bug
-- (grid track compression was just the mechanism; the real cause was
-- content that never fit). breadcrumbs, page headings, and the footer
-- still need the full descriptive name — only the top nav needs a
-- short form, so it gets its own column rather than truncating `name`.
--
-- Nullable: only the 5 top-level categories get a nav_label (the main
-- nav renders top-level categories only; subcategories in the
-- mega-menu already read `name`, unaffected). Code falls back to
-- `name` if nav_label is null, so this never breaks for a category
-- that doesn't have one set.

alter table categories add column nav_label text;

update categories set nav_label = 'Furniture' where slug = 'furniture';
update categories set nav_label = 'Tiles' where slug = 'tiles-wall-finishes';
update categories set nav_label = 'Lighting' where slug = 'lighting';
update categories set nav_label = 'Sanitaryware' where slug = 'sanitaryware-bath';
update categories set nav_label = 'Doors' where slug = 'doors-windows-joinery';
