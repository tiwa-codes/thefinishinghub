import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { NewArrivalsGrid, type NewArrivalProductCard } from "@/components/home/new-arrivals-grid";
import { createPublicClient } from "@/lib/supabase/public";
import { UNSPLASH_BLUR_DATA_URL } from "@/lib/unsplash";

export const revalidate = 3600;

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

type LookRow = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  image_url: string;
};

type LookProductRow = {
  products: {
    id: string;
    slug: string;
    name: string;
    short_description: string | null;
    created_at: string;
    collection: string | null;
    is_bestseller: boolean;
    categories: { name: string } | null;
    public_product_variants: { id: string; price_kobo: number | null; is_default: boolean | null; requires_quote: boolean | null }[];
    product_images: { url: string; alt_text: string | null; is_primary: boolean; display_order: number }[];
  } | null;
};

async function getLook(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("looks")
    .select("id, title, slug, description, image_url")
    .eq("slug", slug)
    .returns<LookRow[]>()
    .maybeSingle();
  return data;
}

async function getLookProducts(lookId: string): Promise<NewArrivalProductCard[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("look_products")
    .select(
      `
      products (
        id, slug, name, short_description, created_at, collection, is_bestseller,
        categories ( name ),
        public_product_variants!inner ( id, price_kobo, is_default, requires_quote ),
        product_images ( url, alt_text, is_primary, display_order )
      )
    `,
    )
    .eq("look_id", lookId)
    .eq("products.status", "published")
    .eq("products.public_product_variants.is_default", true)
    .order("display_order")
    .returns<LookProductRow[]>();

  return (data ?? [])
    .filter((row): row is { products: NonNullable<LookProductRow["products"]> } => row.products != null)
    .map((row) => {
      const p = row.products;
      const variant = p.public_product_variants.find((v) => v.is_default) ?? p.public_product_variants[0];
      const primaryImage = p.product_images.find((img) => img.is_primary) ?? p.product_images[0] ?? null;
      const secondaryImage =
        p.product_images.find((img) => !img.is_primary && img.display_order === 2) ?? null;
      return {
        id: p.id,
        slug: p.slug,
        variantId: variant?.id ?? "",
        categoryLabel: p.categories?.name ?? "",
        name: p.name,
        collection: p.collection,
        spec: p.short_description,
        priceKobo: variant?.price_kobo ?? null,
        requiresQuote: variant?.requires_quote ?? false,
        imageUrl: primaryImage?.url ?? null,
        imageAlt: primaryImage?.alt_text ?? p.name,
        secondaryImageUrl: secondaryImage?.url ?? null,
        isNew: Date.now() - new Date(p.created_at).getTime() < THIRTY_DAYS_MS,
        isBestseller: p.is_bestseller,
      };
    });
}

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("looks").select("slug").returns<{ slug: string }[]>();
  return (data ?? []).map((look) => ({ slug: look.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const look = await getLook(params.slug);
  if (!look) return {};
  return {
    title: `${look.title} — The Finishing Hub`,
    description: look.description ?? `${look.title}, a curated look from The Finishing Hub.`,
  };
}

// Basic version, per spec: title, image, product cards in a grid (same
// card component as everywhere else) — no editorial layout pass yet.
export default async function LookDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const look = await getLook(params.slug);
  if (!look) {
    notFound();
  }

  const products = await getLookProducts(look.id);

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <div className="relative h-[360px] w-full overflow-hidden bg-forest lg:h-[480px]">
        <Image
          src={look.image_url}
          alt={look.title}
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL={UNSPLASH_BLUR_DATA_URL}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/50" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-10 lg:px-10 lg:pb-14">
          <h1 className="font-serif text-3xl text-cream lg:text-5xl">{look.title}</h1>
          {look.description && (
            <p className="mt-3 max-w-xl text-cream/85 lg:text-lg">{look.description}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 py-14 lg:px-10 lg:py-20">
        <h2 className="mb-8 font-serif text-2xl font-normal text-ink lg:text-[28px]">
          Shop this look
        </h2>
        {products.length > 0 ? (
          <NewArrivalsGrid products={products} />
        ) : (
          <p className="text-ink/60">No products tagged to this look yet.</p>
        )}
      </div>

      <SiteFooterSection />
    </div>
  );
}
