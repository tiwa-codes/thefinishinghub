import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fullName = typeof body?.fullName === "string" ? body.fullName.trim() : "";
  const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";
  const email = typeof body?.email === "string" ? body.email.trim() : "";
  const phone = typeof body?.phone === "string" ? body.phone.trim() : "";
  const businessType = typeof body?.businessType === "string" ? body.businessType.trim() : "";
  const yearsInBusiness =
    typeof body?.yearsInBusiness === "string" ? body.yearsInBusiness.trim() : "";
  const budgetRange = typeof body?.budgetRange === "string" ? body.budgetRange.trim() : "";
  const referralSource =
    typeof body?.referralSource === "string" ? body.referralSource.trim() : "";

  if (!fullName || !companyName || !email || !phone || !businessType) {
    return NextResponse.json(
      {
        success: false,
        error: "Full name, company name, email, phone and business type are required.",
      },
      { status: 400 },
    );
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch (error) {
    console.error(
      "POST /api/trade-application: could not create the admin Supabase client.",
      error,
    );
    return NextResponse.json(
      { success: false, error: "Server misconfiguration — please try again shortly." },
      { status: 500 },
    );
  }

  const { error } = await admin.from("trade_applications").insert({
    full_name: fullName,
    company_name: companyName,
    email,
    phone,
    business_type: businessType,
    years_in_business: yearsInBusiness || null,
    budget_range: budgetRange || null,
    referral_source: referralSource || null,
  });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
