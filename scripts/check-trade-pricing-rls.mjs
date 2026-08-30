#!/usr/bin/env node
// Verifies public_product_variants' trade-pricing behavior against the
// REAL linked Supabase database — this is pure RLS/view logic (a Postgres
// CASE expression joined against trade_accounts), which the mocked Vitest
// suite structurally can't exercise (it never touches real SQL). Creates
// and tears down disposable auth users each run; needs live Supabase
// connectivity and SUPABASE_SERVICE_ROLE_KEY.
//
// Local/manual only (`npm run check:trade-pricing`) — not part of the
// automated test/build chain, same reasoning as check-brand-guardrails-
// dynamic.mjs: it touches a real database with real (if disposable) data
// and shouldn't run unattended in CI.
//
// Covers, in order:
//   1. An approved trade account sees the correctly discounted price.
//   2. A different, non-trade customer session sees the unmodified price
//      for the exact same variant at the exact same moment — no
//      cross-session leakage.
//   3. requires_quote still wins: null price even for an approved trade
//      account.
//   4. is_trade_price is falsy — specifically SQL NULL, not `false` — for
//      a customer with NO trade_accounts row at all. This is the actual
//      NULL case ((ta.status = 'approved') on a LEFT JOIN row that never
//      matched), distinct from a row that exists but isn't approved
//      (status = 'pending'/'rejected', which is a separate, already-
//      falsy-via-normal-boolean-comparison case). Whatever reads this
//      column must use truthy/falsy logic, never `=== false` — see the
//      audit note below.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";

function loadEnvVar(name) {
  if (process.env[name]) return process.env[name];
  const envPath = new URL("../.env", import.meta.url);
  if (!existsSync(envPath)) return undefined;
  const content = readFileSync(envPath, "utf8");
  const match = content.match(new RegExp(`^${name}=(.*)$`, "m"));
  return match ? match[1].trim() : undefined;
}

const failures = [];
function check(label, ok, extra = "") {
  console.log(`[${ok ? "PASS" : "FAIL"}] ${label}${extra ? " — " + extra : ""}`);
  if (!ok) failures.push(label);
}

async function main() {
  const url = loadEnvVar("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = loadEnvVar("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceKey = loadEnvVar("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !anonKey || !serviceKey) {
    console.error(
      "check-trade-pricing-rls: NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / " +
        "SUPABASE_SERVICE_ROLE_KEY not set (checked process.env and .env).",
    );
    process.exit(1);
  }

  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  const stamp = Date.now();
  const createdUserIds = [];
  let flaggedProductId = null;

  try {
    // Real staff, to approve the trade application.
    const staffEmail = `check-trade-pricing-staff-${stamp}@thefinishinghub.internal`;
    const { data: staffUser } = await admin.auth.admin.createUser({
      email: staffEmail,
      password: "CheckVerify123!",
      email_confirm: true,
    });
    createdUserIds.push(staffUser.user.id);
    await admin.from("staff").insert({ id: staffUser.user.id, email: staffEmail, full_name: "Trade Pricing Check" });
    const staff = createClient(url, anonKey, { auth: { persistSession: false } });
    await staff.auth.signInWithPassword({ email: staffEmail, password: "CheckVerify123!" });

    // Trade customer — applies, gets approved with a real discount.
    const tradeEmail = `check-trade-pricing-trade-${stamp}@thefinishinghub.internal`;
    const { data: tradeUser } = await admin.auth.admin.createUser({
      email: tradeEmail,
      password: "CheckVerify123!",
      email_confirm: true,
    });
    createdUserIds.push(tradeUser.user.id);
    const tradeCustomer = createClient(url, anonKey, { auth: { persistSession: false } });
    await tradeCustomer.auth.signInWithPassword({ email: tradeEmail, password: "CheckVerify123!" });
    await tradeCustomer
      .from("trade_accounts")
      .insert({ id: tradeUser.user.id, business_name: "Trade Pricing Check Ltd", tier_requested: "preferred" });
    await staff
      .from("trade_accounts")
      .update({
        status: "approved",
        tier: "preferred",
        discount_percent: 15.0,
        approved_by: staffUser.user.id,
        approved_at: new Date().toISOString(),
      })
      .eq("id", tradeUser.user.id);

    // Plain customer — a real account, but NO trade_accounts row at all.
    // This is the specific case under test for #4: distinct from a row
    // that exists with status != 'approved'.
    const plainEmail = `check-trade-pricing-plain-${stamp}@thefinishinghub.internal`;
    const { data: plainUser } = await admin.auth.admin.createUser({
      email: plainEmail,
      password: "CheckVerify123!",
      email_confirm: true,
    });
    createdUserIds.push(plainUser.user.id);
    const plainCustomer = createClient(url, anonKey, { auth: { persistSession: false } });
    await plainCustomer.auth.signInWithPassword({ email: plainEmail, password: "CheckVerify123!" });

    // Real, published, non-quote variant to compare pricing on.
    const { data: variant } = await admin
      .from("product_variants")
      .select("id, product_id, price_kobo, products!inner(requires_quote, status)")
      .eq("products.requires_quote", false)
      .eq("products.status", "published")
      .order("price_kobo", { ascending: true })
      .limit(1)
      .single();
    const expectedDiscounted = Math.round(variant.price_kobo * 0.85);

    // 1. Approved trade account sees the discounted price.
    const { data: tradeView } = await tradeCustomer
      .from("public_product_variants")
      .select("price_kobo, is_trade_price")
      .eq("id", variant.id)
      .single();
    check(
      "Approved trade account sees the correctly discounted price",
      tradeView.price_kobo === expectedDiscounted && tradeView.is_trade_price === true,
      `expected=${expectedDiscounted} got=${tradeView.price_kobo} is_trade_price=${tradeView.is_trade_price}`,
    );

    // 2. Different, non-trade session, same variant, same moment: no leak.
    const { data: plainView } = await plainCustomer
      .from("public_product_variants")
      .select("price_kobo, is_trade_price")
      .eq("id", variant.id)
      .single();
    check(
      "A different, non-trade session sees the unmodified price for the exact same variant at the exact same moment — no cross-session leakage",
      plainView.price_kobo === variant.price_kobo,
      `catalog=${variant.price_kobo} got=${plainView.price_kobo}`,
    );

    // 4 (checked here, alongside its contrasting case): is_trade_price is
    // falsy — SQL NULL specifically — for a customer with no
    // trade_accounts row at all. Anything reading this column must use
    // `if (row.is_trade_price)` / `!row.is_trade_price`, never
    // `=== false`, or this exact case silently falls through as
    // "neither true nor false".
    check(
      "is_trade_price is falsy (NULL) for a customer with no trade_accounts row at all — the actual NULL case, not merely a rejected/pending one",
      !plainView.is_trade_price && plainView.is_trade_price !== false,
      `is_trade_price=${JSON.stringify(plainView.is_trade_price)}`,
    );

    // 3. requires_quote wins over any discount.
    const { data: quoteVariant } = await admin
      .from("product_variants")
      .select("id, products!inner(requires_quote)")
      .eq("products.requires_quote", true)
      .limit(1)
      .maybeSingle();

    if (quoteVariant) {
      const { data: tradeOnQuote } = await tradeCustomer
        .from("public_product_variants")
        .select("price_kobo")
        .eq("id", quoteVariant.id)
        .single();
      check(
        "A requires_quote product still returns null price even for an approved trade account",
        tradeOnQuote.price_kobo === null,
        `got=${tradeOnQuote.price_kobo}`,
      );
    } else {
      // No product is currently flagged requires_quote — flag the same
      // variant's product temporarily, check, then revert (see finally).
      flaggedProductId = variant.product_id;
      await admin.from("products").update({ requires_quote: true }).eq("id", flaggedProductId);
      const { data: tradeOnNowQuoted } = await tradeCustomer
        .from("public_product_variants")
        .select("price_kobo")
        .eq("id", variant.id)
        .single();
      check(
        "A requires_quote product still returns null price even for an approved trade account (temporarily flagged for this check)",
        tradeOnNowQuoted.price_kobo === null,
        `got=${tradeOnNowQuoted.price_kobo}`,
      );
    }
  } finally {
    if (flaggedProductId) {
      const { error } = await admin.from("products").update({ requires_quote: false }).eq("id", flaggedProductId);
      if (error) console.error(`cleanup: failed to revert requires_quote on ${flaggedProductId}: ${error.message}`);
    }
    // Errors surfaced, not swallowed — a disposable test account left
    // behind silently is exactly the kind of thing that goes unnoticed
    // until someone stumbles on it. Three separate passes, not one loop
    // per user: trade_accounts.approved_by references staff(id) with no
    // ON DELETE clause, so deleting the staff row for the approving
    // staffer BEFORE the trade_accounts row that names them in
    // approved_by violates that FK (observed directly: the customer's
    // trade_accounts row still pointed at the staff id at that moment in
    // per-user-loop order). All trade_accounts rows must go first,
    // regardless of whose turn it "is" in createdUserIds.
    for (const id of createdUserIds) {
      const { error: tradeErr } = await admin.from("trade_accounts").delete().eq("id", id);
      if (tradeErr) console.error(`cleanup: failed to delete trade_accounts row for ${id}: ${tradeErr.message}`);
    }
    for (const id of createdUserIds) {
      const { error: staffErr } = await admin.from("staff").delete().eq("id", id);
      if (staffErr) console.error(`cleanup: failed to delete staff row for ${id}: ${staffErr.message}`);
    }
    for (const id of createdUserIds) {
      const { error: deleteErr } = await admin.auth.admin.deleteUser(id);
      if (deleteErr) console.error(`cleanup: failed to delete disposable test user ${id}: ${deleteErr.message}`);
    }
  }

  if (failures.length > 0) {
    console.error(`\ncheck-trade-pricing-rls: FAILED (${failures.length} of 4 checks)`);
    process.exit(1);
  }
  console.log("\ncheck-trade-pricing-rls: OK — all 4 checks passed");
}

main();
