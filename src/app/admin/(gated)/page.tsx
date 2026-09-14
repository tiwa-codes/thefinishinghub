import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function AdminOverviewPage() {
  const supabase = createAdminClient();

  const [{ count: publishedCount }, { count: orderCount }, { data: products }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("status", "published"),
      supabase.from("orders").select("id", { count: "exact", head: true }),
      supabase.from("products").select(
        "id, product_images ( id ), product_variants ( price_kobo, is_default )",
      ),
    ]);

  const noImageCount = (products ?? []).filter(
    (p) => (p.product_images?.length ?? 0) === 0,
  ).length;
  const noPriceCount = (products ?? []).filter((p) => {
    const variants = p.product_variants ?? [];
    const defaultVariant = variants.find((v) => v.is_default) ?? variants[0];
    return !defaultVariant || defaultVariant.price_kobo == null;
  }).length;

  const stats = [
    { label: "Published products", value: publishedCount ?? 0, href: "/admin/products?status=published" },
    { label: "Orders", value: orderCount ?? 0, href: "/admin/orders" },
    { label: "Products with no image", value: noImageCount, href: "/admin/products" },
    { label: "Products with no price", value: noPriceCount, href: "/admin/products" },
  ];

  return (
    <div className="max-w-[720px]">
      <div className="mb-8">
        <div className="font-serif text-2xl text-ink">Overview</div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-[2px] border border-[#ddd5c4] bg-white px-5 py-6 hover:border-forest"
          >
            <p className="mb-1 font-serif text-3xl text-ink">{stat.value}</p>
            <p className="text-xs uppercase tracking-[0.08em] text-[#8a8073]">
              {stat.label}
            </p>
          </Link>
        ))}
      </div>
      <div className="mt-8 flex gap-3">
        <Link
          href="/admin/products/new"
          className="rounded-[2px] bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-deep-forest"
        >
          Add product
        </Link>
        <Link
          href="/admin/orders"
          className="rounded-[2px] border border-[#cfc6b6] px-4 py-2 text-sm font-medium text-ink hover:border-forest"
        >
          View orders
        </Link>
        <Link
          href="/admin/looks"
          className="rounded-[2px] border border-[#cfc6b6] px-4 py-2 text-sm font-medium text-ink hover:border-forest"
        >
          Manage looks
        </Link>
      </div>
    </div>
  );
}
