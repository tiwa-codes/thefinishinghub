import { createAdminClient } from "@/lib/supabase/admin";

type TradeApplicationRow = {
  id: string;
  full_name: string;
  company_name: string;
  email: string;
  phone: string;
  business_type: string;
  years_in_business: string | null;
  budget_range: string | null;
  referral_source: string | null;
  created_at: string;
};

export default async function AdminTradeApplicationsPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("trade_applications")
    .select(
      "id, full_name, company_name, email, phone, business_type, years_in_business, budget_range, referral_source, created_at",
    )
    .order("created_at", { ascending: false })
    .returns<TradeApplicationRow[]>();

  const applications = data ?? [];

  return (
    <div>
      <div className="mb-6 font-serif text-2xl text-ink">Trade Applications</div>
      <div className="overflow-x-auto rounded-[2px] border border-[#ddd5c4] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddd5c4] text-xs uppercase tracking-[0.06em] text-[#8a8073]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Business type</th>
              <th className="px-4 py-3 font-medium">Years</th>
              <th className="px-4 py-3 font-medium">Budget</th>
              <th className="px-4 py-3 font-medium">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee7d8]">
            {applications.map((app) => (
              <tr key={app.id}>
                <td className="px-4 py-3 text-ink">{app.full_name}</td>
                <td className="px-4 py-3 text-[#6b6155]">{app.company_name}</td>
                <td className="px-4 py-3 text-[#6b6155]">{app.email}</td>
                <td className="px-4 py-3 text-[#6b6155]">{app.phone}</td>
                <td className="px-4 py-3 text-[#6b6155]">{app.business_type}</td>
                <td className="px-4 py-3 text-[#6b6155]">{app.years_in_business ?? "—"}</td>
                <td className="px-4 py-3 text-[#6b6155]">{app.budget_range ?? "—"}</td>
                <td className="px-4 py-3 text-[#6b6155]">
                  {new Date(app.created_at).toLocaleDateString("en-NG", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </td>
              </tr>
            ))}
            {applications.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-[#8a8073]">
                  No trade applications yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
