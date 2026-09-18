import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const projectType = typeof body?.projectType === "string" ? body.projectType.trim() : "";
  const description = typeof body?.description === "string" ? body.description.trim() : "";
  const budgetRange = typeof body?.budgetRange === "string" ? body.budgetRange.trim() : "";

  if (!fullName || !email || !phone || !projectType) {
    return NextResponse.json(
      { success: false, error: "Name, email, phone and project type are required." },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error("POST /api/design-enquiry: could not create the admin Supabase client.", error);
    return NextResponse.json(
      { success: false, error: "Server misconfiguration — please try again shortly." },
      { status: 500 },
    );
  }

  const { error } = await admin.from("design_enquiries").insert({
    full_name: fullName,
    email,
    phone,
    project_type: projectType,
    description: description || null,
    budget_range: budgetRange || null,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
