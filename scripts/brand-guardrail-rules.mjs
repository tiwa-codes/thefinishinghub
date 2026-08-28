// Shared between check-brand-guardrails.mjs (static prerendered HTML) and
// check-brand-guardrails-dynamic.mjs (real browser-rendered HTML for
// dynamic routes) so the two rule sets can never drift apart.
//
// Enforces two CLAUDE.md rules that are easy to violate by accident:
//   1. "Bespoke" must never appear anywhere — it was a subcategory,
//      deleted entirely for conceptually tying the site to the Bajgio
//      Lagos workshop as an operational unit.
//   2. "Bajgio" and "Lagos" may only appear inside the shared <footer>
//      (the trademark-holder line) — never anywhere else on the site.

export const FORBIDDEN_EVERYWHERE = [{ label: "Bespoke", pattern: /Bespoke/gi }];
export const FOOTER_ONLY = [
  { label: "Bajgio", pattern: /Bajgio/gi },
  { label: "Lagos", pattern: /Lagos/gi },
];

// Next.js embeds a serialized RSC flight payload inside inline <script>
// tags (for hydration) that duplicates real markup as escaped text without
// real <footer> tags — a naive "is this match inside <footer>...</footer>"
// check would false-positive on its own duplicate, so script tags are
// stripped first.
export function findViolations(route, html) {
  const stripped = html.replace(/<script[\s\S]*?<\/script>/gi, "");
  const violations = [];

  for (const { label, pattern } of FORBIDDEN_EVERYWHERE) {
    const matches = stripped.match(pattern);
    if (matches) {
      violations.push(`${route}: "${label}" found ${matches.length}x — must not appear anywhere`);
    }
  }

  const footerStart = stripped.indexOf("<footer");
  const footerEnd = stripped.indexOf("</footer>");
  const outsideFooter =
    footerStart === -1
      ? stripped
      : stripped.slice(0, footerStart) + stripped.slice(footerEnd + "</footer>".length);

  for (const { label, pattern } of FOOTER_ONLY) {
    const matches = outsideFooter.match(pattern);
    if (matches) {
      violations.push(
        `${route}: "${label}" found ${matches.length}x outside the footer (only the footer trademark line may mention it)`,
      );
    }
  }

  return violations;
}
