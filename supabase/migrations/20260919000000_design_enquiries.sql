CREATE TABLE IF NOT EXISTS design_enquiries (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name     text NOT NULL,
  email         text NOT NULL,
  phone         text NOT NULL,
  project_type  text NOT NULL,
  description   text,
  budget_range  text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE design_enquiries ENABLE ROW LEVEL SECURITY;
-- No public read/insert policy — this table is written to exclusively via
-- the service-role admin client from /api/design-enquiry, and read only
-- by staff via the same admin client on /admin/design-enquiries. There is
-- deliberately no anonymous-facing RLS policy at all.
