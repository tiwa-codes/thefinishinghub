import { NextResponse } from "next/server";
import { confirmPayment, verifyPaystackSignature } from "@/lib/paystack";

// Paystack's server calling us — there is no customer session here at all,
// which is exactly why confirmPayment() (not this route) owns the actual
// paid-transition logic and re-verifies against Paystack directly rather
// than trusting anything in this payload.
export async function POST(request: Request) {
  // Signature is computed over the RAW request bytes — reading .json()
  // first and re-serializing would produce a different byte sequence than
  // what Paystack signed, and verification would always fail.
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyPaystackSignature(rawBody, signature)) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }

  const event = JSON.parse(rawBody);

  if (event.event !== "charge.success") {
    // Acknowledged, no action — we only act on charge.success.
    return NextResponse.json({ received: true });
  }

  const reference = event.data?.reference;
  if (typeof reference !== "string" || !reference) {
    return NextResponse.json({ error: "MISSING_REFERENCE" }, { status: 400 });
  }

  try {
    const result = await confirmPayment(reference);
    // Every outcome here is either success, already-handled, or a
    // permanent mismatch that a retry won't fix — acknowledge with 200
    // either way so Paystack doesn't retry forever, and rely on error
    // logging (not retry-driven correction) for anomalies like
    // amount_mismatch or order_not_found.
    if (result.outcome === "amount_mismatch" || result.outcome === "order_not_found") {
      console.error("Paystack webhook: unexpected confirmPayment outcome", reference, result);
    }
    return NextResponse.json({ received: true, outcome: result.outcome });
  } catch (err) {
    // A genuinely transient failure (e.g. our own DB briefly unreachable)
    // — worth letting Paystack retry.
    console.error("Paystack webhook: confirmPayment threw", reference, err);
    return NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
  }
}
