#!/usr/bin/env node
// Post-build content audit — runs automatically after every `next build`
// (wired as the "postbuild" npm script) against the real prerendered HTML
// for every route in .next/server/app. Every route in this site is
// static/ISR, so this covers the whole site with no per-page test to
// remember to write when a new page or product is added.
//
// Enforces two CLAUDE.md rules that are easy to violate by accident:
//   1. "Bespoke" must never appear anywhere — it was a subcategory,
//      deleted entirely for conceptually tying the site to the Bajgio
//      Lagos workshop as an operational unit.
//   2. "Bajgio" and "Lagos" may only appear inside the shared <footer>
//      (the trademark-holder line) — never anywhere else on the site.
//
// Each route's HTML is streamed twice by Next.js: once as real markup,
// once more as a serialized RSC flight payload inside inline <script>
// tags (for hydration). The flight payload doesn't have real <footer>
// tags, so a naive "is this match inside <footer>...</footer>" check
// would false-positive on its own duplicate. Script tags are stripped
// before checking containment.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";

const APP_DIR = join(process.cwd(), ".next/server/app");

if (!existsSync(APP_DIR)) {
  console.error(
    "check-brand-guardrails: .next/server/app not found — run `npm run build` first.",
  );
  process.exit(1);
}

function collectHtmlFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...collectHtmlFiles(full));
    } else if (entry.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

function routeNameFor(file) {
  const rel = relative(APP_DIR, file).replace(/\.html$/, "").split(sep).join("/");
  return rel === "index" ? "/" : `/${rel}`;
}

const FORBIDDEN_EVERYWHERE = [{ label: "Bespoke", pattern: /Bespoke/gi }];
const FOOTER_ONLY = [
  { label: "Bajgio", pattern: /Bajgio/gi },
  { label: "Lagos", pattern: /Lagos/gi },
];

const files = collectHtmlFiles(APP_DIR);
const failures = [];

for (const file of files) {
  const route = routeNameFor(file);
  const html = readFileSync(file, "utf8").replace(/<script[\s\S]*?<\/script>/gi, "");

  for (const { label, pattern } of FORBIDDEN_EVERYWHERE) {
    const matches = html.match(pattern);
    if (matches) {
      failures.push(`${route}: "${label}" found ${matches.length}x — must not appear anywhere`);
    }
  }

  const footerStart = html.indexOf("<footer");
  const footerEnd = html.indexOf("</footer>");
  const outsideFooter =
    footerStart === -1
      ? html
      : html.slice(0, footerStart) + html.slice(footerEnd + "</footer>".length);

  for (const { label, pattern } of FOOTER_ONLY) {
    const matches = outsideFooter.match(pattern);
    if (matches) {
      failures.push(
        `${route}: "${label}" found ${matches.length}x outside the footer (only the footer trademark line may mention it)`,
      );
    }
  }
}

if (failures.length > 0) {
  console.error(
    `check-brand-guardrails: FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"} across ${files.length} routes)\n` +
      failures.map((f) => `  - ${f}`).join("\n"),
  );
  process.exit(1);
}

console.log(`check-brand-guardrails: OK — ${files.length} routes checked, no violations`);
