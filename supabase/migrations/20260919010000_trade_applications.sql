-- trade_accounts.id references auth.users(id) directly (account-tied by
-- design — trade pricing is applied site-wide via
-- public_product_variants joining on auth.uid() = trade_accounts.id),
-- and has no email/phone/business-type columns. It can't hold an
-- anonymous, no-signup application, so this is a genuinely separate
-- table rather than a forced fit into trade_accounts.
--
-- An approved row here does NOT automatically grant trade pricing — a
-- staff member still needs to create the real trade_accounts row (tied
-- to the applicant's own account, once they have one) for pricing to
-- take effect. This table is a staff-facing inbox, not a pricing source.
CREATE TABLE IF NOT EXISTS trade_applications (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name         text NOT NULL,
  company_name      text NOT NULL,
  email             text NOT NULL,
  phone             text NOT NULL,
  business_type     text NOT NULL,
  years_in_business text,
  budget_range      text,
  referral_source   text,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE trade_applications ENABLE ROW LEVEL SECURITY;
-- No public read/insert policy — written exclusively via the service-role
-- admin client from /api/trade-application, read only by staff via the
-- same admin client on /admin/trade-applications.
