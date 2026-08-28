import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function AdminOverviewPage() {
  const supabase = createClient();
  const [{ count: categoryCount }, { count: productCount }, { count: draftCount }] =
    await Promise.all([
      supabase.from("categories").select("id", { count: "exact", head: true }),
      supabase.from("products").select("id", { count: "exact", head: true }),
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "draft"),
    ]);

  return (
    <div className="max-w-[720px]">
      <div className="mb-8">
        <div className="font-serif text-2xl text-ink">Overview</div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Link
          href="/admin/categories"
          className="rounded-[2px] border border-[#ddd5c4] bg-white px-5 py-6 hover:border-forest"
        >
          <p className="mb-1 font-serif text-3xl text-ink">{categoryCount ?? 0}</p>
          <p className="text-xs uppercase tracking-[0.08em] text-[#8a8073]">
            Categories
          </p>
        </Link>
        <Link
          href="/admin/products"
          className="rounded-[2px] border border-[#ddd5c4] bg-white px-5 py-6 hover:border-forest"
        >
          <p className="mb-1 font-serif text-3xl text-ink">{productCount ?? 0}</p>
          <p className="text-xs uppercase tracking-[0.08em] text-[#8a8073]">
            Products
          </p>
        </Link>
        <Link
          href="/admin/products?status=draft"
          className="rounded-[2px] border border-[#ddd5c4] bg-white px-5 py-6 hover:border-forest"
        >
          <p className="mb-1 font-serif text-3xl text-ink">{draftCount ?? 0}</p>
          <p className="text-xs uppercase tracking-[0.08em] text-[#8a8073]">
            Drafts
          </p>
        </Link>
      </div>
    </div>
  );
}
