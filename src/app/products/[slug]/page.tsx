import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { ProductDetailView } from "@/components/product-detail/product-detail-view";
import type { GalleryImage } from "@/components/product-detail/product-gallery";
import type { ProductVariant } from "@/components/product-detail/variant-selector";
import type { NewArrivalProductCard } from "@/components/home/new-arrivals-grid";
import { createPublicClient } from "@/lib/supabase/public";
import type { BreadcrumbCrumb } from "@/components/listing/listing-breadcrumb";

// ISR, same reasoning as every other page: cookie-free client, so this
// stays eligible for static generation with a revalidation window.
export const revalidate = 3600;

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  short_description: string | null;
  status: string;
  video_url: string | null;
  warranty_years: number | null;
  origin: string | null;
  categories: { id: string; slug: string; name: string; parent_id: string | null } | null;
  styles: { name: string; slug: string } | null;
};

type VariantRow = {
  id: string;
  finish: string | null;
  color: string | null;
  size: string | null;
  price_kobo: number | null;
  is_default: boolean | null;
  in_stock: boolean | null;
};

type ImageRow = {
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
};

async function getProduct(slug: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select(
      `
      id,
      slug,
      name,
      description,
      short_description,
      status,
      video_url,
      warranty_years,
      origin,
      categories ( id, slug, name, parent_id ),
      styles ( name, slug )
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .returns<ProductRow[]>()
    .maybeSingle();

  return data;
}

async function getVariants(productId: string) {
  const supabase = createPublicClient();
  // public_product_variants, not the raw product_variants table the task
  // text named — this is the only variant-price path public-facing code
  // may read from (it nulls price_kobo for a requires_quote product; see
  // lib/supabase/public.ts and every other product page in this codebase).
  const { data } = await supabase
    .from("public_product_variants")
    .select("id, finish, color, size, price_kobo, is_default, in_stock")
    .eq("product_id", productId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })
    .returns<VariantRow[]>();

  return data ?? [];
}

async function getImages(productId: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("product_images")
    .select("url, alt_text, is_primary, display_order")
    .eq("product_id", productId)
    .order("display_order", { ascending: true })
    .returns<ImageRow[]>();

  return data ?? [];
}

async function getParentCategory(parentId: string) {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("categories")
    .select("name, slug")
    .eq("id", parentId)
    .returns<{ name: string; slug: string }[]>()
    .maybeSingle();
  return data ?? null;
}

type RelatedRow = {
  id: string;
  slug: string;
  name: string;
  short_description: string | null;
  categories: { name: string } | null;
  public_product_variants: { id: string; price_kobo: number | null; is_default: boolean | null; requires_quote: boolean | null }[];
  product_images: { url: string; alt_text: string | null; is_primary: boolean }[];
};

function toCard(row: RelatedRow): NewArrivalProductCard {
  const variant = row.public_product_variants.find((v) => v.is_default) ?? row.public_product_variants[0];
  const primaryImage = row.product_images.find((img) => img.is_primary) ?? row.product_images[0] ?? null;
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
}

const RELATED_SELECT = `
  id,
  slug,
  name,
  short_description,
  categories ( name ),
  public_product_variants!inner ( id, price_kobo, is_default, requires_quote ),
  product_images ( url, alt_text, is_primary )
`;

async function getRelated(categoryId: string | undefined, excludeId: string) {
  const supabase = createPublicClient();
  const results: RelatedRow[] = [];

  if (categoryId) {
    const { data } = await supabase
      .from("products")
      .select(RELATED_SELECT)
      .eq("status", "published")
      .eq("category_id", categoryId)
      .eq("public_product_variants.is_default", true)
      .neq("id", excludeId)
      .order("created_at", { ascending: false })
      .limit(4)
      .returns<RelatedRow[]>();
    results.push(...(data ?? []));
  }

  if (results.length < 4) {
    const { data } = await supabase
      .from("products")
      .select(RELATED_SELECT)
      .eq("status", "published")
      .eq("public_product_variants.is_default", true)
      .neq("id", excludeId)
      .order("created_at", { ascending: false })
      // Over-fetch since some of these may duplicate the category-first
      // results above and get filtered out by the existingIds check below.
      .limit(4 + results.length)
      .returns<RelatedRow[]>();

    const existingIds = new Set(results.map((r) => r.id));
    for (const row of data ?? []) {
      if (results.length >= 4) break;
      if (!existingIds.has(row.id)) results.push(row);
    }
  }

  return results.slice(0, 4).map(toCard);
}

export async function generateStaticParams() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("slug")
    .eq("status", "published")
    .returns<{ slug: string }[]>();

  return (data ?? []).map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const product = await getProduct(params.slug);
  if (!product) return {};
  return {
    title: `${product.name} — The Finishing Hub`,
    description:
      product.description?.slice(0, 150) ??
      `${product.name} available at The Finishing Hub showroom in Abuja.`,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProduct(params.slug);
  if (!product) {
    notFound();
  }

  const [variantRows, imageRows] = await Promise.all([
    getVariants(product.id),
    getImages(product.id),
  ]);

  const parentCategory = product.categories?.parent_id
    ? await getParentCategory(product.categories.parent_id)
    : null;

  const breadcrumb: BreadcrumbCrumb[] = [{ label: "Home", href: "/" }];
  if (parentCategory && product.categories) {
    breadcrumb.push({ label: parentCategory.name, href: `/${parentCategory.slug}` });
    breadcrumb.push({ label: product.categories.name });
  } else if (product.categories) {
    breadcrumb.push({ label: product.categories.name, href: `/${product.categories.slug}` });
  }
  breadcrumb.push({ label: product.name });

  const images: GalleryImage[] = imageRows.map((img) => ({
    url: img.url,
    alt: img.alt_text ?? product.name,
  }));

  const variants: ProductVariant[] = variantRows.map((v) => ({
    id: v.id,
    finish: v.finish,
    color: v.color,
    size: v.size,
    priceKobo: v.price_kobo,
    isDefault: v.is_default ?? false,
    inStock: v.in_stock ?? true,
  }));

  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0];

  const related = await getRelated(product.categories?.id, product.id);

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <ProductDetailView
        productId={product.id}
        breadcrumb={breadcrumb}
        categoryName={product.categories?.name ?? ""}
        styleName={product.styles?.name ?? null}
        name={product.name}
        description={product.description}
        warrantyYears={product.warranty_years}
        origin={product.origin}
        videoUrl={product.video_url}
        images={images}
        variants={variants}
        defaultVariantId={defaultVariant?.id ?? ""}
        related={related}
      />
      <SiteFooterSection />
    </div>
  );
}
