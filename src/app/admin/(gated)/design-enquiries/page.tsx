import { createAdminClient } from "@/lib/supabase/admin";

type DesignEnquiryRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  project_type: string;
  budget_range: string | null;
  description: string | null;
  created_at: string;
};

export default async function AdminDesignEnquiriesPage() {
  const admin = createAdminClient();
  const { data } = await admin
    .from("design_enquiries")
    .select("id, full_name, email, phone, project_type, budget_range, description, created_at")
    .order("created_at", { ascending: false })
    .returns<DesignEnquiryRow[]>();

  const enquiries = data ?? [];

  return (
    <div>
      <div className="mb-6 font-serif text-2xl text-ink">Design Enquiries</div>
      <div className="overflow-hidden rounded-[2px] border border-[#ddd5c4] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddd5c4] text-xs uppercase tracking-[0.06em] text-[#8a8073]">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Email</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Project type</th>
              <th className="px-4 py-3 font-medium">Budget</th>
              <th className="px-4 py-3 font-medium">Received</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee7d8]">
            {enquiries.map((enquiry) => (
              <tr key={enquiry.id}>
                <td className="px-4 py-3 text-ink">{enquiry.full_name}</td>
                <td className="px-4 py-3 text-[#6b6155]">{enquiry.email}</td>
                <td className="px-4 py-3 text-[#6b6155]">{enquiry.phone}</td>
                <td className="px-4 py-3 text-[#6b6155]">{enquiry.project_type}</td>
                <td className="px-4 py-3 text-[#6b6155]">{enquiry.budget_range ?? "—"}</td>
                <td className="px-4 py-3 text-[#6b6155]">
                  <div>
                    {new Date(enquiry.created_at).toLocaleDateString("en-NG", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  {enquiry.description && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-forest">
                        Description
                      </summary>
                      <p className="mt-1 max-w-[280px] whitespace-pre-wrap text-xs text-[#6b6155]">
                        {enquiry.description}
                      </p>
                    </details>
                  )}
                </td>
              </tr>
            ))}
            {enquiries.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#8a8073]">
                  No design enquiries yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
