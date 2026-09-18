// "paid" only ever gets set by confirmPayment() (server-verified against
// Paystack) — staff can move an order through processing/shipped/delivered
// or cancel it, but never set it back to paid or pending_payment from the
// admin UI. See src/app/api/admin/orders/[id]/status/route.ts.
export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending_payment: "Payment pending",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Colour-coded per The Finishing Hub admin spec: pending=amber, paid=green,
// processing=blue, shipped=purple, delivered=grey, cancelled=red.
export const ORDER_STATUS_BADGE_CLASS: Record<string, string> = {
  pending_payment: "bg-[#f5ecd8] text-[#8a6d1d]",
  paid: "bg-[#e4ede7] text-forest",
  processing: "bg-[#dde8f5] text-[#2f5f9e]",
  shipped: "bg-[#ebe1f5] text-[#6b3fa0]",
  delivered: "bg-[#e9e7e3] text-[#5c574d]",
  cancelled: "bg-[#f5e6e4] text-[#b3261e]",
};

// Staff-settable next statuses from a given current one — mirrors what
// the admin status route actually allows (paid is confirmPayment()'s
// alone; pending_payment is the pre-payment starting state nothing ever
// moves back to).
export function nextStatusOptions(current: string): OrderStatus[] {
  if (current === "paid") return ["processing", "shipped", "delivered", "cancelled"];
  if (current === "processing") return ["shipped", "delivered", "cancelled"];
  if (current === "shipped") return ["delivered"];
  if (current === "pending_payment") return ["cancelled"];
  return [];
}
