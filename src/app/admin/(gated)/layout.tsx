import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminLogoutButton } from "@/components/admin/admin-logout-button";

const NAV_LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/products", label: "Products" },
];

export default async function AdminGatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  // Redundant with src/middleware.ts by design (defense in depth) — the
  // middleware is the actual gate and is left untouched; this check just
  // means the layout never renders staff-only chrome around unauthenticated
  // content if it were ever reached some other way.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: staffRow } = await supabase
    .from("staff")
    .select("email, full_name")
    .eq("id", user.id)
    .maybeSingle();
  if (!staffRow) redirect("/admin/login");

  return (
    <div className="flex min-h-screen bg-cream">
      <aside className="flex w-60 shrink-0 flex-col border-r border-[#ddd5c4] bg-white px-5 py-8">
        <div className="mb-8">
          <div className="font-serif text-xl text-ink">The Finishing Hub</div>
          <div className="text-xs uppercase tracking-[0.2em] text-[#8a8073]">
            Staff
          </div>
        </div>
        <nav className="flex flex-col gap-1 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-[2px] px-3 py-2 text-ink hover:bg-cream"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto border-t border-[#ddd5c4] pt-4">
          <p className="mb-1 text-xs text-[#8a8073]">Signed in as</p>
          <p className="mb-3 truncate text-sm text-ink">
            {staffRow.full_name ?? staffRow.email}
          </p>
          <AdminLogoutButton />
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
    </div>
  );
}
