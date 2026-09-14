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

type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string;
};

type ProductRow = {
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
};

async function getCollection(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("collections")
    .select("id, name, slug, description, image_url")
    .eq("slug", slug)
    .returns<CollectionRow[]>()
    .maybeSingle();
  return data;
}

// products.collection is a free-text column (matches the seed data — e.g.
// "Positano Collection"), not a foreign key to the new collections table,
// so this joins on the collection's own name rather than its id.
async function getCollectionProducts(collectionName: string): Promise<NewArrivalProductCard[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select(
      `
      id, slug, name, short_description, created_at, collection, is_bestseller,
      categories ( name ),
      public_product_variants!inner ( id, price_kobo, is_default, requires_quote ),
      product_images ( url, alt_text, is_primary, display_order )
    `,
    )
    .eq("collection", collectionName)
    .eq("status", "published")
    .eq("public_product_variants.is_default", true)
    .order("created_at", { ascending: false })
    .returns<ProductRow[]>();

  return (data ?? []).map((p) => {
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
  const { data } = await supabase.from("collections").select("slug").returns<{ slug: string }[]>();
  return (data ?? []).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const collection = await getCollection(params.slug);
  if (!collection) return {};
  return {
    title: `${collection.name} — The Finishing Hub`,
    description: collection.description ?? `Shop the ${collection.name} at The Finishing Hub.`,
  };
}

export default async function CollectionDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const collection = await getCollection(params.slug);
  if (!collection) {
    notFound();
  }

  const products = await getCollectionProducts(collection.name);

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <div className="relative h-[360px] w-full overflow-hidden bg-forest lg:h-[480px]">
        <Image
          src={collection.image_url}
          alt={collection.name}
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL={UNSPLASH_BLUR_DATA_URL}
          className="object-cover"
        />
        <div className="absolute inset-0 bg-ink/50" />
        <div className="absolute inset-x-0 bottom-0 px-5 pb-10 lg:px-10 lg:pb-14">
          <h1 className="font-serif text-3xl text-cream lg:text-5xl">{collection.name}</h1>
          {collection.description && (
            <p className="mt-3 max-w-xl text-cream/85 lg:text-lg">{collection.description}</p>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-5 py-14 lg:px-10 lg:py-20">
        {products.length > 0 ? (
          <NewArrivalsGrid products={products} />
        ) : (
          <p className="text-ink/60">No products in this collection yet.</p>
        )}
      </div>

      <SiteFooterSection />
    </div>
  );
}
