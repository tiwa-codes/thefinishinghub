#!/usr/bin/env node
// Dynamic companion to check-brand-guardrails.mjs (which only covers
// prerendered static/ISR HTML). Every route below is session-gated or
// reads searchParams and is therefore never prerendered — it only exists
// once a real server is handling requests — so this script starts the
// just-built production server, drives real browser requests at them with
// Playwright, and runs the same two brand rules (see
// brand-guardrail-rules.mjs) against the actual rendered HTML.
//
// PUBLIC_ROUTES are checked in a fresh, unauthenticated context each (any
// real visitor) — this includes /cart plus every listing page that reads
// searchParams for real filter/sort state (subcategory pages, category
// "all" pages, /search), which all went from static/ISR to dynamic when
// that filtering shipped and so silently dropped out of the static
// checker's coverage — this list is what keeps them covered.
//
// /admin is checked separately, in a context that signs in as a
// dedicated, permanent "guardrail-bot" staff account
// (GUARDRAIL_STAFF_EMAIL/PASSWORD below) — it exists only so this check
// can load a real staff-gated page; see the credentials' own comment in
// .env for how to recreate it if it's ever deleted.
//
// Runs as part of "postbuild" (after check-brand-guardrails.mjs) — this
// means every `next build`, including Vercel deploys, now needs live
// Supabase connectivity and a working Chromium binary. Chromium is fetched
// via the "postinstall" npm script (playwright install chromium), so a
// fresh `npm install` on a new machine or CI image pays that cost once.

import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { findViolations } from "./brand-guardrail-rules.mjs";

const PORT = 4173;
const BASE = `http://localhost:${PORT}`;
const PUBLIC_ROUTES = [
  "/cart",
  "/search?q=bed",
  "/furniture/bedroom",
  "/furniture/dining",
  "/furniture/living",
  "/furniture/workspace",
  "/furniture/office",
  "/furniture/all",
  "/tiles-wall-finishes/all",
  "/lighting/all",
  "/sanitaryware-bath/shower",
  "/sanitaryware-bath/bathtub",
  "/sanitaryware-bath/toilet",
  "/sanitaryware-bath/all",
  "/doors-windows-joinery/all",
];
const STAFF_ROUTES = ["/admin"];
const ROUTES_TO_CHECK = [...PUBLIC_ROUTES, ...STAFF_ROUTES];

function loadEnvVar(name) {
  if (process.env[name]) return process.env[name];
  const envPath = new URL("../.env", import.meta.url);
  if (!existsSync(envPath)) return undefined;
  const content = readFileSync(envPath, "utf8");
  const match = content.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim() : undefined;
}

async function waitForServer(url, timeoutMs) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

async function main() {
  const staffEmail = loadEnvVar("GUARDRAIL_STAFF_EMAIL");
  const staffPassword = loadEnvVar("GUARDRAIL_STAFF_PASSWORD");
  if (!staffEmail || !staffPassword) {
    console.error(
      "check-brand-guardrails-dynamic: GUARDRAIL_STAFF_EMAIL / GUARDRAIL_STAFF_PASSWORD " +
        "not set (checked process.env and .env). The /admin check needs a real staff " +
        "session — see .env.example and this script's header comment.",
    );
    process.exit(1);
  }

  // fileURLToPath (not .pathname) so a space in the project directory name
  // doesn't end up percent-encoded ("%20") in a real filesystem path.
  const projectRoot = fileURLToPath(new URL("..", import.meta.url));
  const nextBin = fileURLToPath(new URL("../node_modules/.bin/next", import.meta.url));
  // Direct binary path rather than "npx next" — spawn() doesn't reliably
  // resolve npx (a shell shim) without shell:true, and this is one less
  // thing to go wrong in a CI build image.
  const server = spawn(nextBin, ["start", "-p", String(PORT)], {
    cwd: projectRoot,
    stdio: ["ignore", "pipe", "pipe"],
  });
  let serverOutput = "";
  server.stdout.on("data", (d) => (serverOutput += d.toString()));
  server.stderr.on("data", (d) => (serverOutput += d.toString()));

  let browser;
  const failures = [];
  // Thrown-and-caught rather than process.exit()'d from inside try — exit()
  // skips pending finally blocks, which would orphan the spawned server
  // and browser on any failure path below.
  let fatalMessage = null;

  try {
    const up = await waitForServer(BASE, 30000);
    if (!up) {
      fatalMessage =
        `check-brand-guardrails-dynamic: server never came up on ${BASE} within 30s.\n` +
        serverOutput;
    } else {
      browser = await chromium.launch();

      // Every public route — fresh, unauthenticated context each, any
      // real visitor.
      for (const route of PUBLIC_ROUTES) {
        const context = await browser.newContext();
        const page = await context.newPage();
        await page.goto(`${BASE}${route}`, { waitUntil: "networkidle" });
        failures.push(...findViolations(route, await page.content()));
        await context.close();
      }

      // /admin — fresh context, real staff session via the guardrail-bot account.
      const adminContext = await browser.newContext();
      const adminPage = await adminContext.newPage();
      await adminPage.goto(`${BASE}/admin/login`, { waitUntil: "networkidle" });
      await adminPage.getByLabel("Email").fill(staffEmail);
      await adminPage.getByLabel("Password").fill(staffPassword);
      await adminPage.getByRole("button", { name: /Sign in/ }).click();
      try {
        await adminPage.waitForURL("**/admin", { timeout: 15000 });
        failures.push(...findViolations("/admin", await adminPage.content()));
      } catch {
        fatalMessage =
          "check-brand-guardrails-dynamic: could not reach /admin as staff — check that " +
          "GUARDRAIL_STAFF_EMAIL/PASSWORD are correct and the guardrail-bot staff row " +
          "still exists.";
      }
      await adminContext.close();
    }
  } finally {
    if (browser) await browser.close();
    server.kill();
  }

  if (fatalMessage) {
    console.error(fatalMessage);
    process.exit(1);
  }

  if (failures.length > 0) {
    console.error(
      `check-brand-guardrails-dynamic: FAILED (${failures.length} issue${failures.length === 1 ? "" : "s"} across ${ROUTES_TO_CHECK.length} routes)\n` +
        failures.map((f) => `  - ${f}`).join("\n"),
    );
    process.exit(1);
  }

  console.log(
    `check-brand-guardrails-dynamic: OK — ${ROUTES_TO_CHECK.length} routes checked (${ROUTES_TO_CHECK.join(", ")}), no violations`,
  );
}

main();
