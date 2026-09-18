import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nextStatusOptions } from "@/lib/order-status";

// Staff status changes go through the service-role client so the full
// pending_payment/paid/processing/shipped/delivered/cancelled vocabulary
// is available from the admin UI — the RLS "staff update order status"
// policy only allows fulfilled/cancelled via the cookie-scoped client, and
// is left as-is (defense in depth) rather than widened, since "paid" must
// never become staff-settable through any path but confirmPayment().
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const { data: staffRow } = await supabase
    .from("staff")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();
  if (!staffRow) {
    return NextResponse.json({ error: "Staff access required." }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const nextStatus = body?.status;
  if (typeof nextStatus !== "string") {
    return NextResponse.json({ error: "A status is required." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error(
      "POST /api/admin/orders/[id]/status: could not create the admin Supabase client.",
      error,
    );
    return NextResponse.json(
      { error: "Server misconfiguration — the admin service is temporarily unavailable." },
      { status: 500 },
    );
  }

  const { data: order, error: fetchError } = await admin
    .from("orders")
    .select("id, status")
    .eq("id", params.id)
    .maybeSingle();
  if (fetchError || !order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  const allowed = nextStatusOptions(order.status);
  if (!allowed.includes(nextStatus as (typeof allowed)[number])) {
    return NextResponse.json(
      { error: `Cannot move an order from "${order.status}" to "${nextStatus}".` },
      { status: 400 },
    );
  }

  const { error: updateError } = await admin
    .from("orders")
    .update({ status: nextStatus, updated_at: new Date().toISOString() })
    .eq("id", params.id);
  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
