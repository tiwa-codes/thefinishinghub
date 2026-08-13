# The Finishing Hub (TFH) — Website Project Context

## What this is
E-commerce + brochure site for The Finishing Hub, a premium interiors showroom
in Abuja, Nigeria (furniture, tiles/finishes, lighting, sanitaryware, doors,
interior design services). Site: thefinishinghub.com. Legally a trademark of
Bajgio — mention Bajgio ONLY in the footer trademark line ("A trademark of
Bajgio") + badge. Never elsewhere on the public site.

## Repo scope — read this before creating any new repo or app
This repo = **public website + staff admin panel**, same Next.js app, admin
routes gated behind staff auth. They are NOT separate projects.
The POS PWA (showroom tablets + desktop browsers) is a **separate repo**,
built later. Do not scaffold POS here. Do not add offline/service-worker
logic to this repo — it will conflict with SSR/SEO on the public site.

## Stack
- Next.js 14 (App Router), TypeScript, Tailwind CSS
- Supabase = the entire backend (Postgres, Auth, Storage, auto APIs). There
  is no separate backend service to build. Generate types from schema with
  `supabase gen types typescript` — do not hand-maintain duplicate types.
- Deploy: Vercel
- Payments: Paystack (primary checkout) + Flutterwave (international/
  diaspora cards, redundancy). Both configured via their SDKs — not custom-built.
- Email: Resend + Google Workspace. SMS: Termii. Booking: Calendly.
  Accounting: QuickBooks/Zoho. All external services, integration only.

## Brand
- Colors: Forest Green #0d3d28 · Deep Forest #072818 · Brass Gold #b89544 ·
  Bright Gold #d4b660 · Cream #f4efe4 · Ink #161310
- Fonts: Fraunces (serif, headings) · Inter (sans, body) · JetBrains Mono
  (utility text/labels)
- Visual reference: Bernhardt.com — the ONLY primary reference. Take their
  restraint and photography-led layout. Do NOT take editorial gimmicks:
  no italic accent type, no "§" section numbering, no magazine-style framing.
  If in doubt, strip it out rather than add a design flourish.

## Site structure (locked)
- ONE site. Master brand = The Finishing Hub. Furniture leads the catalog.
- Categories (top-level nav, in this order):
  1. Furniture & Furnishings (lead category)
  2. Tiles & Wall Finishes
  3. Lighting & Home Automation
  4. Sanitarywares & Bath Accessories
  5. Doors, Windows & Joinery
- Interior Design is a SERVICE, not a 6th catalog category — do not add it
  to the primary category nav.
- Nav: two-row. Thin utility bar on top, main nav below. TFH monogram +
  wordmark dominant, left-aligned (wordmark must NOT shrink to illegible —
  this was corrected once already, don't regress it). Five category
  dropdowns centered, each a DWR-style mega-menu (e.g. Furniture → Living
  Room / Dining / Bedroom / Workspace / Bespoke). Gold "Visit the Showroom"
  CTA button, right-aligned.
- Homepage: NO product carousel anywhere (this was explicitly removed once —
  do not reintroduce it). Use a "Shop by Room" photo-tile grid instead
  (Living Room / Dining / Bedroom / Workspace), Bernhardt-style.
- Category landing pages: BoConcept-style sub-category photo tiles as an
  intermediate step — do not link straight from nav into a raw product grid.
- Product listing pages: horizontal filter bar, 4-column grid, "In
  Showroom" indicator on cards instead of stock-count badges, no promo
  stickers/ribbons.
- Product detail pages: image gallery, configuration options (finish/size
  etc. where applicable), "Complete the Room" cross-sell module.
- Cart: full page, not a slide-out drawer. Line items on the left, sticky
  order summary on the right, considered empty-state copy (not a bare
  "your cart is empty").

## Real contact facts — use exactly, never invent or approximate
- Suites 2B–2E, AA Lukoro Plaza, Plot 1120, Oladipo Diya Way, Gudu District,
  Abuja
- Phone: +234 (0) 803 311 7302
- Email: thefinishinghubng@gmail.com
- Hours: Mon–Sat, 9am–6pm

## Explicit exclusions
- Never reference the Bajgio Lagos workshop as an operational unit anywhere
  on the site — Bajgio appears ONLY as the trademark-holder line in the footer.
- No timeline/schedule/launch-date language in any generated copy or docs.

## Working method
Plan before coding: break work into small tasks, get them confirmed, then
implement. Prefer test-driven development — write a failing test, make it
pass, refactor. Don't build for hypothetical future needs (e.g. do not
pre-build POS hooks or offline logic into this repo). If a request is
ambiguous against anything above, ask rather than assume.
