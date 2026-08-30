import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

type OrderRow = Database["public"]["Tables"]["orders"]["Row"];

const PAYSTACK_BASE_URL = "https://api.paystack.co";

function authHeader() {
  return { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}` };
}

type PaystackInitializeResponse = {
  status: boolean;
  message: string;
  data: { authorization_url: string; access_code: string; reference: string } | null;
};

// Starts (or restarts) payment for an order the caller has already
// verified ownership of (an RLS-scoped read, done by the route calling
// this — this function itself uses the admin client, since writing
// payment_reference needs to happen before the order is paid and there is
// deliberately no customer-writable UPDATE policy on orders). A fresh
// reference every call — see confirmPayment's comment for why reusing
// order_number as the reference breaks retries.
export async function initializeOrderPayment(order: {
  id: string;
  order_number: string;
  customer_email: string;
  total_kobo: number;
  callbackUrl: string;
}): Promise<PaystackInitializeResponse> {
  const reference = `${order.order_number}-${crypto.randomBytes(4).toString("hex")}`;
  const admin = createAdminClient();
  await admin.from("orders").update({ payment_reference: reference }).eq("id", order.id);

  return initializeTransaction({
    email: order.customer_email,
    amountKobo: order.total_kobo,
    reference,
    callbackUrl: order.callbackUrl,
  });
}

export async function initializeTransaction(params: {
  email: string;
  amountKobo: number;
  reference: string;
  callbackUrl: string;
}): Promise<PaystackInitializeResponse> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    method: "POST",
    headers: { ...authHeader(), "Content-Type": "application/json" },
    body: JSON.stringify({
      email: params.email,
      amount: params.amountKobo,
      reference: params.reference,
      callback_url: params.callbackUrl,
    }),
    cache: "no-store",
  });
  return res.json();
}

type PaystackVerifyResponse = {
  status: boolean;
  message: string;
  data: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
    gateway_response: string;
    paid_at: string | null;
  } | null;
};

export async function verifyTransaction(reference: string): Promise<PaystackVerifyResponse> {
  const res = await fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: authHeader(),
    cache: "no-store",
  });
  return res.json();
}

// Webhook signature check per Paystack's spec: HMAC SHA-512 of the RAW
// request body (not a re-serialized/parsed copy — that produces a
// different byte sequence and always fails), compared with
// crypto.timingSafeEqual rather than === so the comparison doesn't leak
// timing information about how many leading bytes matched. Buffer lengths
// must match before calling timingSafeEqual (it throws otherwise) — an
// absent or malformed header just fails closed here instead.
export function verifyPaystackSignature(rawBody: string, signatureHeader: string | null): boolean {
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(rawBody)
    .digest("hex");

  const expectedBuf = Buffer.from(expected, "hex");
  const receivedBuf = Buffer.from(signatureHeader, "hex");
  if (expectedBuf.length !== receivedBuf.length) return false;

  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
}

export type ConfirmPaymentResult =
  | { outcome: "paid"; order: OrderRow }
  | { outcome: "already_paid"; order: OrderRow }
  | { outcome: "verification_failed"; reason: string }
  | { outcome: "amount_mismatch"; reason: string }
  | { outcome: "order_not_found" };

// The ONLY place that ever marks an order paid. Callable from anywhere
// that has confirmed a reference is worth checking (the webhook, the
// customer's return-from-Paystack callback page) — always re-verifies
// against Paystack directly rather than trusting whatever the caller
// already believes, and is safe to call more than once for the same
// reference (Paystack retries webhooks; the callback page and a webhook
// can race for the same order).
export async function confirmPayment(reference: string): Promise<ConfirmPaymentResult> {
  const admin = createAdminClient();

  // Looked up by payment_reference, not order_number: Paystack rejects
  // re-initializing a transaction reference it's already seen — even for
  // a failed/abandoned attempt (confirmed live: "Duplicate Transaction
  // Reference") — so each Pay Now click generates a fresh reference
  // (order_number + a short unique suffix, see initializeOrderPayment
  // below) and payment_reference tracks the CURRENT one, letting a
  // customer retry after a declined card without being permanently
  // locked out of paying for that order.
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("payment_reference", reference)
    .maybeSingle();

  if (!order) return { outcome: "order_not_found" };
  if (order.status === "paid") return { outcome: "already_paid", order };

  const verification = await verifyTransaction(reference);
  if (!verification.status || verification.data?.status !== "success") {
    return {
      outcome: "verification_failed",
      reason: verification.data?.gateway_response ?? verification.message ?? "verification failed",
    };
  }

  if (verification.data.amount !== order.total_kobo) {
    return {
      outcome: "amount_mismatch",
      reason: `order total_kobo=${order.total_kobo}, Paystack verified amount=${verification.data.amount}`,
    };
  }

  // Guard the transition itself with the WHERE clause (not just the read
  // above) — an atomic compare-and-swap so a concurrent caller that lost
  // the race (webhook vs. callback-page fallback, or a duplicate webhook
  // delivery) can't double-apply the paid transition or clear the cart
  // twice.
  const { data: updatedRows, error } = await admin
    .from("orders")
    .update({ status: "paid", payment_provider: "paystack", payment_reference: reference })
    .eq("id", order.id)
    .eq("status", "pending_payment")
    .select();

  if (error) throw error;

  if (!updatedRows || updatedRows.length === 0) {
    const { data: recheck } = await admin.from("orders").select("*").eq("id", order.id).single();
    if (recheck?.status === "paid") return { outcome: "already_paid", order: recheck };
    throw new Error("Order update matched no rows and is not already paid — unexpected state");
  }

  const updated = updatedRows[0];

  if (updated.user_id) {
    await admin.from("cart_items").delete().eq("user_id", updated.user_id);
  }

  return { outcome: "paid", order: updated };
}
