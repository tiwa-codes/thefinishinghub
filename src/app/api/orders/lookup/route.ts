import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Guest order lookup — the customer has no auth session here (this is
// deliberately reachable without signing in, unlike /account's real
// order history), so this is the one place a service-role read is
// gated purely by "does the reference AND email both match", not RLS.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const reference = typeof body?.reference === "string" ? body.reference.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";

  if (!reference || !email) {
    return NextResponse.json(
      { error: "An order reference and email are both required." },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("POST /api/orders/lookup: could not create the admin Supabase client.", error);
    return NextResponse.json(
      { error: "Server misconfiguration — please try again shortly." },
      { status: 500 },
    );
  }

  // payment_reference, not paystack_reference — see supabase/migrations/
  // 20260813180000_v1_schema.sql for the real orders schema.
  const { data: order, error } = await admin
    .from("orders")
    .select(
      `
      order_number, customer_name, customer_email, status, total_kobo,
      shipping_address, created_at, payment_reference,
      order_items ( product_name_snapshot, variant_label_snapshot, unit_price_kobo, quantity )
    `,
    )
    .eq("payment_reference", reference)
    .ilike("customer_email", email)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({ found: true, order });
}
