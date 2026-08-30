import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { NewArrivalsGrid, type NewArrivalProductCard } from "./new-arrivals-grid";

// public_product_variants, not product_variants — the only variant-price
// path public-facing code may read from. It nulls price_kobo for a
// requires_quote product at the data layer.
type ProductQueryRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  categories: { name: string } | null;
  public_product_variants: {
    id: string;
    price_kobo: number | null;
    is_default: boolean;
    requires_quote: boolean;
  }[];
  product_images: { url: string; alt_text: string | null; is_primary: boolean }[];
};

// Async Server Component: fetches, then hands plain data to the
// presentational <NewArrivalsGrid>. Kept separate because RTL/jsdom can't
// render an async Server Component directly (see page.test.tsx).
export async function NewArrivalsSection() {
  const supabase = createPublicClient();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      slug,
      name,
      short_description,
      categories ( name ),
      public_product_variants!inner ( id, price_kobo, is_default, requires_quote ),
      product_images ( url, alt_text, is_primary )
    `,
    )
    .eq("status", "published")
    .eq("public_product_variants.is_default", true)
    .order("created_at", { ascending: false })
    .limit(4)
    .returns<ProductQueryRow[]>();

  if (error) {
    console.error("Failed to load new arrivals:", error.message);
  }

  const products: NewArrivalProductCard[] = (data ?? []).map((row) => {
    const variant = row.public_product_variants[0];
    const primaryImage =
      row.product_images.find((img) => img.is_primary) ??
      row.product_images[0] ??
      null;

    return {
      id: row.id,
      slug: row.slug,
      variantId: variant?.id ?? "",
      categoryLabel: row.categories?.name ?? "",
      name: row.name,
      spec: row.short_description,
      priceKobo: variant?.price_kobo ?? null,
      requiresQuote: variant?.requires_quote ?? false,
      imageUrl: primaryImage?.url ?? null,
      imageAlt: primaryImage?.alt_text ?? row.name,
    };
  });

  return (
    <section className="bg-[#ebe5db]">
      <div className="mx-auto max-w-[1440px] px-5 py-12 lg:px-10 lg:py-[88px]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-[14px] text-xs uppercase tracking-[0.2em] text-gold">
              New arrivals
            </div>
            <h2 className="font-serif text-2xl font-normal text-ink lg:text-[32px]">
              Recently added to the floor
            </h2>
          </div>
          <Link
            href="#"
            className="border-b border-gold pb-[3px] text-[13px] font-medium tracking-wide text-forest no-underline"
          >
            View all products
          </Link>
        </div>

        <NewArrivalsGrid products={products} />
      </div>
    </section>
  );
}
