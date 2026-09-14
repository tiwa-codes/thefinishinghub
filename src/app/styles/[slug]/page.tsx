import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { ShowroomCta } from "@/components/home/showroom-cta";
import { StyleProductGrid, type StyleProductCard } from "@/components/styles/style-product-grid";
import { createPublicClient } from "@/lib/supabase/public";
import { UNSPLASH_BLUR_DATA_URL, unsplashUrl } from "@/lib/unsplash";

export const revalidate = 3600;

// Hero image + editorial copy per style — hardcoded content, same pattern
// as STYLE_TILES (styles.description/hero_image_path aren't populated in
// the DB yet). Villa's hero is the same local file as the homepage hero's
// brand slide; Contemporary's is the same Unsplash id as the homepage
// hero's Contemporary slide (both per spec, not the "Find Your Style" tile
// images used on the /styles index).
const STYLE_CONTENT: Record<
  string,
  {
    descriptor: string;
    heroImageSrc?: string;
    heroImageId?: string;
    editorial: string;
  }
> = {
  villa: {
    descriptor: "Presidential. Ornate. Built to impress.",
    heroImageSrc: "/images/hero-living-room.png",
    editorial:
      "Villa furniture is for those who build above the ordinary. Carved hardwoods, gold-accented frames, and upholstery chosen for presence — pieces that make a room feel like an estate, not just a house.",
  },
  contemporary: {
    descriptor: "Minimal. Refined. Made to last.",
    heroImageId: "1611048267451-e6ed903d4a38",
    editorial:
      "Contemporary furniture is defined by what it removes. Clean silhouettes, quality materials, and craftsmanship that speaks quietly — furniture that ages with you rather than dating around you.",
  },
};

type StyleRow = { id: string; name: string; slug: string };

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  categories: { name: string } | null;
  product_images: { url: string; alt_text: string | null; is_primary: boolean }[];
  public_product_variants: { price_kobo: number | null; is_default: boolean }[];
};

async function getStyle(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("styles")
    .select("id, name, slug")
    .eq("slug", slug)
    .returns<StyleRow[]>()
    .maybeSingle();
  return data;
}

const PRODUCT_SELECT = `
  id,
  slug,
  name,
  description,
  categories ( name ),
  product_images ( url, alt_text, is_primary ),
  public_product_variants ( price_kobo, is_default )
`;

async function getProductsForStyle(styleId: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("style_id", styleId)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .returns<ProductRow[]>();
  return data ?? [];
}

async function getFallbackProducts() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .returns<ProductRow[]>();
  return data ?? [];
}

function toCard(row: ProductRow): StyleProductCard {
  const variant =
    row.public_product_variants.find((v) => v.is_default) ?? row.public_product_variants[0];
  const primaryImage =
    row.product_images.find((img) => img.is_primary) ?? row.product_images[0] ?? null;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    categoryLabel: row.categories?.name ?? "",
    priceKobo: variant?.price_kobo ?? null,
    imageUrl: primaryImage?.url ?? null,
    imageAlt: primaryImage?.alt_text ?? row.name,
  };
}

type MoodboardRow = { image_url: string; slug: string };

async function getMoodboard(styleId: string) {
  const supabase = createPublicClient();
  // The task's literal query only selects image_url, but the moodboard
  // links each image to /looks/[slug] — slug has to come along for that.
  const { data } = await supabase
    .from("looks")
    .select("image_url, slug")
    .eq("style_id", styleId)
    .order("display_order")
    .limit(4)
    .returns<MoodboardRow[]>();
  return data ?? [];
}

type OtherStyleRow = { name: string; slug: string };

async function getOtherStyles(currentStyleId: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("styles")
    .select("name, slug")
    .neq("id", currentStyleId)
    .order("display_order")
    .returns<OtherStyleRow[]>();
  return data ?? [];
}

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase.from("styles").select("slug").returns<{ slug: string }[]>();
  return (data ?? []).map((style) => ({ slug: style.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const style = await getStyle(params.slug);
  if (!style) return {};
  const descriptor = STYLE_CONTENT[style.slug]?.descriptor ?? "";
  return {
    title: `${style.name} Collection — The Finishing Hub`,
    description: `Shop ${style.name} furniture and interiors at The Finishing Hub, Abuja. ${descriptor}`,
  };
}

export default async function StyleDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const style = await getStyle(params.slug);
  if (!style) {
    notFound();
  }

  const content = STYLE_CONTENT[style.slug];
  const styleProducts = await getProductsForStyle(style.id);
  const usingFallback = styleProducts.length === 0;
  const products = usingFallback ? await getFallbackProducts() : styleProducts;
  const cards = products.map(toCard);
  const moodboard = await getMoodboard(style.id);
  const otherStyles = await getOtherStyles(style.id);

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />

      {/* Style hero — 60vh, not full-viewport (interior page, not the homepage) */}
      <section className="relative flex min-h-[60vh] items-end overflow-hidden bg-forest text-cream">
        {content?.heroImageSrc ? (
          <Image
            src={content.heroImageSrc}
            alt={`${style.name} style interior`}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : content?.heroImageId ? (
          <Image
            src={unsplashUrl(content.heroImageId, 1920)}
            alt={`${style.name} style interior`}
            fill
            priority
            sizes="100vw"
            placeholder="blur"
            blurDataURL={UNSPLASH_BLUR_DATA_URL}
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-ink/60" />
        <div className="relative z-10 px-5 pb-14 lg:px-10 lg:pb-20">
          <h1 className="mb-3 font-serif text-4xl text-cream lg:text-6xl">{style.name}</h1>
          {content?.descriptor && (
            <p className="text-base text-cream/85 lg:text-lg">{content.descriptor}</p>
          )}
        </div>
      </section>

      {/* Style description band */}
      {content?.editorial && (
        <section className="bg-cream px-5 py-14 lg:py-20">
          <p className="mx-auto max-w-2xl text-center text-[15px] leading-[1.8] text-ink/80 lg:text-lg">
            {content.editorial}
          </p>
        </section>
      )}

      {/* Moodboard — purely atmospheric, no captions */}
      {moodboard.length > 0 && (
        <section className="bg-cream px-5 pb-14 lg:px-10 lg:pb-20">
          <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-3 lg:gap-4">
            {moodboard.map((item, i) => (
              <Link
                key={item.slug + i}
                href={`/looks/${item.slug}`}
                className="relative block aspect-square overflow-hidden rounded-[6px]"
              >
                <Image
                  src={item.image_url}
                  alt=""
                  fill
                  sizes="(min-width: 1024px) 25vw, 50vw"
                  placeholder="blur"
                  blurDataURL={UNSPLASH_BLUR_DATA_URL}
                  className="object-cover"
                />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Products grid */}
      <section className="bg-cream px-5 pb-16 lg:px-10 lg:pb-24">
        <div className="mx-auto max-w-[1440px]">
          {usingFallback && cards.length > 0 && (
            <p className="mb-4 text-sm italic text-ink/60">
              Showing all products while we build out this collection.
            </p>
          )}
          <h2 className="mb-8 font-serif text-2xl font-normal text-ink lg:text-[32px]">
            The {style.name} Collection
          </h2>
          {cards.length > 0 ? (
            <StyleProductGrid products={cards} />
          ) : (
            <p className="text-ink/60">No products published yet — check back soon.</p>
          )}
        </div>
      </section>

      {/* Explore more styles */}
      {otherStyles.length > 0 && (
        <section className="bg-cream px-5 pb-16 text-center lg:px-10">
          <div className="mb-4 text-xs uppercase tracking-[0.2em] text-ink/50">
            Explore more styles
          </div>
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2">
            {otherStyles.map((other) => {
              const words = other.name.split(" ");
              const [first, ...rest] = words;
              return (
                <Link
                  key={other.slug}
                  href={`/styles/${other.slug}`}
                  className="font-serif text-xl text-ink no-underline hover:text-forest"
                >
                  {rest.length > 0 ? (
                    <>
                      {first} <em className="italic">{rest.join(" ")}</em>
                    </>
                  ) : (
                    <em className="italic">{first}</em>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <ShowroomCta />
      <SiteFooterSection />
    </div>
  );
}
