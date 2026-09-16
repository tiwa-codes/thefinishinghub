import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Gated by src/middleware.ts for every /admin/* page, but this is an API
// route under /api/, which the middleware matcher doesn't treat as an
// admin route — so the staff session check happens here explicitly,
// same pattern as the payment webhook's own trust boundary reasoning in
// lib/supabase/admin.ts.
export async function POST(request: Request) {
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
  const email = body?.email;
  if (typeof email !== "string" || !email.trim()) {
    return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("POST /api/admin/invite: could not create the admin Supabase client.", error);
    return NextResponse.json(
      { error: "Server misconfiguration — the admin service is temporarily unavailable." },
      { status: 500 },
    );
  }

  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    email.trim(),
  );
  if (inviteErr || !invited.user) {
    return NextResponse.json(
      { error: inviteErr?.message ?? "Could not send invite." },
      { status: 400 },
    );
  }

  const { error: staffErr } = await admin.from("staff").insert({
    id: invited.user.id,
    email: email.trim(),
    role: "admin",
  });
  if (staffErr) {
    return NextResponse.json({ error: staffErr.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
