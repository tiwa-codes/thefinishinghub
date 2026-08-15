-- Removes the throwaway subcategory added in
-- 20260817100000_verify_data_driven_nav_add.sql now that the live
-- add-and-reflect check has been confirmed and screenshotted.

delete from categories where slug = 'furniture-verify-temp';
