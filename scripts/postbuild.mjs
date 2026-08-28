#!/usr/bin/env node
// Orchestrates the full postbuild brand-guardrail chain (static, then
// dynamic) — and is the one place SKIP_BRAND_GUARDRAIL is honored.
//
// The skip requires TWO env vars, not one: SKIP_BRAND_GUARDRAIL plus a
// non-empty SKIP_BRAND_GUARDRAIL_REASON. A bare boolean flag is exactly
// the kind of thing that gets set for one incident and quietly left on
// forever. Requiring a written reason means whoever sets it in Vercel has
// to leave a visible, faintly embarrassing explanation sitting in the
// project's env var list — which is the point: it should be awkward to
// forget, not convenient to leave on.

import { execFileSync } from "node:child_process";

const skip = process.env.SKIP_BRAND_GUARDRAIL;
const reason = process.env.SKIP_BRAND_GUARDRAIL_REASON;

if (skip) {
  if (!reason || !reason.trim()) {
    console.error(
      "postbuild: SKIP_BRAND_GUARDRAIL is set but SKIP_BRAND_GUARDRAIL_REASON is " +
        "missing or empty. Refusing to skip silently — either unset " +
        "SKIP_BRAND_GUARDRAIL, or set SKIP_BRAND_GUARDRAIL_REASON to a real, " +
        "specific reason for this deploy.",
    );
    process.exit(1);
  }

  const banner = "=".repeat(70);
  console.warn(
    `${banner}\n` +
      "BRAND GUARDRAIL CHECKS SKIPPED for this build\n" +
      `${banner}\n` +
      `Reason:     ${reason.trim()}\n` +
      `Skipped at: ${new Date().toISOString()}\n\n` +
      "This build did NOT verify the Bespoke/Bajgio/Lagos placement rules on\n" +
      "any route, static or dynamic. Unset SKIP_BRAND_GUARDRAIL and\n" +
      "SKIP_BRAND_GUARDRAIL_REASON once this deploy's specific need has passed —\n" +
      "do not leave these configured as persistent Vercel project env vars.\n" +
      `${banner}`,
  );
  process.exit(0);
}

try {
  execFileSync(process.execPath, ["scripts/check-brand-guardrails.mjs"], {
    stdio: "inherit",
  });
  execFileSync(process.execPath, ["scripts/check-brand-guardrails-dynamic.mjs"], {
    stdio: "inherit",
  });
} catch (err) {
  process.exit(typeof err.status === "number" ? err.status : 1);
}
