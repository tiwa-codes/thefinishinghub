import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { ListingView } from "@/components/listing/listing-view";
import type { ListingProduct } from "@/components/listing/listing-product-grid";
import { createPublicClient } from "@/lib/supabase/public";
import { formatNaira } from "@/lib/format";

// ISR, same reasoning as / and /furniture: cookie-free client, nothing in
// this route's render path touches cookies()/headers().
export const revalidate = 3600;

type CategoryRow = { id: string; name: string };

type ProductQueryRow = {
  id: string;
  name: string;
  is_showroom_display: boolean;
  product_variants: { id: string; price_kobo: number; is_default: boolean }[];
  product_images: { url: string; alt_text: string | null; is_primary: boolean }[];
};

export default async function LivingRoomFurniturePage() {
  const supabase = createPublicClient();

  const { data: category } = await supabase
    .from("categories")
    .select("id, name")
    .eq("slug", "furniture-living")
    .returns<CategoryRow[]>()
    .single();

  const { data: productRows } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      is_showroom_display,
      product_variants!inner ( id, price_kobo, is_default ),
      product_images ( url, alt_text, is_primary )
    `,
    )
    .eq("status", "published")
    .eq("product_variants.is_default", true)
    .eq("category_id", category?.id ?? "")
    .order("created_at", { ascending: false })
    .returns<ProductQueryRow[]>();

  const products: ListingProduct[] = (productRows ?? []).map((row) => {
    const variant = row.product_variants[0];
    const primaryImage =
      row.product_images.find((img) => img.is_primary) ??
      row.product_images[0] ??
      null;

    return {
      id: row.id,
      variantId: variant?.id ?? "",
      name: row.name,
      priceLabel: variant ? formatNaira(variant.price_kobo) : "",
      imageUrl: primaryImage?.url ?? null,
      imageAlt: primaryImage?.alt_text ?? row.name,
      inShowroom: row.is_showroom_display,
    };
  });

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <ListingView
        breadcrumb={[
          { label: "Home", href: "/" },
          { label: "Furniture", href: "/furniture" },
          { label: category?.name ?? "Living Room" },
        ]}
        title="Living Room Furniture"
        description="Sofas, seating, coffee and side tables, and media units — in stock at the Abuja showroom or made to order."
        products={products}
        emptyMessage="No Living Room pieces published yet — check back soon."
      />
      <SiteFooterSection />
    </div>
  );
}
