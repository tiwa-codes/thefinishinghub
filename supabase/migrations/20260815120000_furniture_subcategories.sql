-- TFH schema — v3
-- Adds the remaining Furniture subcategories referenced in SiteNav's mega-menu
-- (src/components/site-nav.tsx MEGA_MENUS.Furniture) but never backed by a
-- categories row: Living, Dining, Workspace, Bespoke. Only Bedroom existed
-- (tfh_schema_v1 seed). Also aligns display_order with the nav's own order
-- (Living, Dining, Bedroom, Workspace, Bespoke) so subcategory tiles on the
-- Category - Furniture page sort consistently with the nav.

insert into categories (slug, name, parent_id, display_order)
select 'furniture-living', 'Living Room', id, 1 from categories where slug = 'furniture'
union all
select 'furniture-dining', 'Dining', id, 2 from categories where slug = 'furniture'
union all
select 'furniture-workspace', 'Workspace', id, 4 from categories where slug = 'furniture'
union all
select 'furniture-bespoke', 'Bespoke', id, 5 from categories where slug = 'furniture';

update categories set display_order = 3 where slug = 'furniture-bedroom';
