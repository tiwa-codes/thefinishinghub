#!/usr/bin/env node
// Post-build content audit — runs automatically after every `next build`
// (wired as the "postbuild" npm script, alongside its dynamic-route
// companion check-brand-guardrails-dynamic.mjs) against the real
// prerendered HTML for every static/ISR route in .next/server/app. This
// covers every page that gets prerendered with no per-page test to
// remember to write when a new page or product is added — but /admin/*
// and /cart are session-gated/dynamic and never prerendered, so they're
// out of this script's reach entirely; see the dynamic companion script
// for those.
//
// Enforces two CLAUDE.md rules that are easy to violate by accident (rule
// definitions and violation-finding logic live in brand-guardrail-rules.mjs,
// shared with the dynamic companion so the two can't drift apart):
//   1. "Bespoke" must never appear anywhere — it was a subcategory,
//      deleted entirely for conceptually tying the site to the Bajgio
//      Lagos workshop as an operational unit.
//   2. "Bajgio" and "Lagos" may only appear inside the shared <footer>
//      (the trademark-holder line) — never anywhere else on the site.

import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { findViolations } from "./brand-guardrail-rules.mjs";

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

const files = collectHtmlFiles(APP_DIR);
const failures = [];

for (const file of files) {
  const route = routeNameFor(file);
  const html = readFileSync(file, "utf8");
  failures.push(...findViolations(route, html));
}

if (failures.length > 0) {
  console.error(
    `check-brand-guardrails: FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"} across ${files.length} routes)\n` +
      failures.map((f) => `  - ${f}`).join("\n"),
  );
  process.exit(1);
}

console.log(`check-brand-guardrails: OK — ${files.length} routes checked, no violations`);
