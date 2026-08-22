-- TFH schema — v6
-- The homepage newsletter form (src/components/home/newsletter.tsx) has
-- always had onSubmit={(e) => e.preventDefault()} and nothing else — a
-- real "button not connected" bug, not just a deferred `#` link, since it
-- looks and behaves like a working form right up until the email is
-- silently discarded. This table gives it somewhere real to write to.
--
-- Insert-only, no select policy: a subscriber can add their own email but
-- can't read the list back (this isn't a members table, no auth.uid()
-- ownership to scope reads to). Actually sending mail through it (Resend)
-- is a separate integration, not part of this migration — see GAPS.md.

create table newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table newsletter_subscribers enable row level security;

create policy "anyone can subscribe"
  on newsletter_subscribers for insert
  with check (true);
