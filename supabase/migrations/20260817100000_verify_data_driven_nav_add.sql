-- Verification-only migration: proves SiteNav/SiteFooter are genuinely
-- data-driven from `categories` (no code change required) by adding a
-- throwaway subcategory, confirming it appears live, then removing it in
-- the next migration. Not a real catalog addition.

insert into categories (slug, name, parent_id, display_order)
select 'furniture-verify-temp', 'Verify Temp', id, 99 from categories where slug = 'furniture';
