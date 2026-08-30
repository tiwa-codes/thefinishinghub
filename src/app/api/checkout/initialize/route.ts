import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initializeOrderPayment } from "@/lib/paystack";

// Starts a real Paystack transaction for an order the customer already
// owns. The order — and therefore its total_kobo — comes from an
// RLS-scoped read (auth.uid() = orders.user_id, the existing "users read
// their own orders" policy), never from the request body: this is Stage
// 1's server-computed total, carried through untouched. There is no way
// for a client to supply or influence an amount here.
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.is_anonymous) {
    return NextResponse.json({ error: "NOT_AUTHENTICATED" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const orderNumber = body?.orderNumber;
  if (typeof orderNumber !== "string" || !orderNumber) {
    return NextResponse.json({ error: "orderNumber is required" }, { status: 400 });
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, customer_email, total_kobo, status")
    .eq("order_number", orderNumber)
    .maybeSingle();

  if (error || !order) {
    return NextResponse.json({ error: "ORDER_NOT_FOUND" }, { status: 404 });
  }

  if (order.status !== "pending_payment") {
    return NextResponse.json({ error: "ORDER_NOT_PAYABLE" }, { status: 409 });
  }

  const origin = new URL(request.url).origin;
  const result = await initializeOrderPayment({
    id: order.id,
    order_number: order.order_number,
    customer_email: order.customer_email,
    total_kobo: order.total_kobo,
    callbackUrl: `${origin}/checkout/callback`,
  });

  if (!result.status || !result.data) {
    return NextResponse.json({ error: result.message || "PAYSTACK_INIT_FAILED" }, { status: 502 });
  }

  return NextResponse.json({ authorizationUrl: result.data.authorization_url });
}
