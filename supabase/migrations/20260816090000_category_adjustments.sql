-- TFH schema — v4
-- Three category fixes:
--
-- 1. Delete the Furniture > Bespoke subcategory. Its label was already
--    sanitized to just "Bespoke" (no literal "Bajgio"/"Lagos" text), but
--    the category itself conceptually represents bespoke work made at
--    the Bajgio Lagos workshop — exactly what CLAUDE.md's exclusion rule
--    ("never reference the Bajgio Lagos workshop as an operational unit
--    anywhere on the site") means to keep off the public site. Renaming
--    the label didn't fix that; removing the category does. Confirmed
--    zero products reference it before this migration was written.
--
-- 2. Add Furniture > Office (was missing; not present in tfh_schema_v3's
--    seeded subcategories despite the earlier session's Furniture pass).
--
-- 3. Sanitarywares & Bath Accessories didn't exist as a top-level
--    category at all yet — only Furniture, Tiles & Wall Finishes, and
--    Lighting & Automation were seeded. Creating it (display_order 4,
--    matching its position in CLAUDE.md's locked nav order) plus its
--    Shower / Bath / Toilet subcategories.

-- 1. Remove Bespoke (zero products reference category_id
-- '1fba96a7-52f9-4972-bf3d-740df74083f1' — verified live before writing
-- this migration).
delete from categories where slug = 'furniture-bespoke';

-- 2. Add the missing Office subcategory under Furniture, taking the
-- display_order slot Bespoke vacated.
insert into categories (slug, name, parent_id, display_order)
select 'furniture-office', 'Office', id, 5 from categories where slug = 'furniture';

-- 3. Sanitarywares & Bath Accessories (top-level) + its subcategories.
insert into categories (slug, name, parent_id, display_order) values
  ('sanitaryware-bath', 'Sanitarywares & Bath Accessories', null, 4);

insert into categories (slug, name, parent_id, display_order)
select 'sanitaryware-shower', 'Shower', id, 1 from categories where slug = 'sanitaryware-bath'
union all
select 'sanitaryware-bathtub', 'Bath', id, 2 from categories where slug = 'sanitaryware-bath'
union all
select 'sanitaryware-toilet', 'Toilet', id, 3 from categories where slug = 'sanitaryware-bath';
