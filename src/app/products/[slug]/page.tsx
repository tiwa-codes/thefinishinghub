import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { ProductDetailView } from "@/components/product-detail/product-detail-view";
import type { GalleryImage } from "@/components/product-detail/product-gallery";
import type { ProductVariant } from "@/components/product-detail/variant-selector";
import { createPublicClient } from "@/lib/supabase/public";
import type { BreadcrumbCrumb } from "@/components/listing/listing-breadcrumb";
import { getRelated } from "@/lib/related-products";

// ISR, same reasoning as every other page: cookie-free client, so this
// stays eligible for static generation with a revalidation window.
export const revalidate = 3600;

type ProductDimensions = { width_cm?: number; depth_cm?: number; height_cm?: number };

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
  dimensions: ProductDimensions | null;
  weight_kg: number | null;
  materials: string | null;
  care_instructions: string | null;
  lead_time_days: number | null;
  features: string[] | null;
  manufacturer: string | null;
  collection: string | null;
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
  requires_quote: boolean | null;
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
      dimensions,
      weight_kg,
      materials,
      care_instructions,
      lead_time_days,
      features,
      manufacturer,
      collection,
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
    .select("id, finish, color, size, price_kobo, is_default, in_stock, requires_quote")
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
    requiresQuote: v.requires_quote ?? false,
  }));

  const defaultVariant = variants.find((v) => v.isDefault) ?? variants[0];

  const related = await getRelated(product.categories?.id, product.id);
  const topLevelCategorySlug = parentCategory?.slug ?? product.categories?.slug ?? null;

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <ProductDetailView
        productId={product.id}
        breadcrumb={breadcrumb}
        categoryName={product.categories?.name ?? ""}
        categorySlug={topLevelCategorySlug}
        styleName={product.styles?.name ?? null}
        name={product.name}
        description={product.description}
        warrantyYears={product.warranty_years}
        origin={product.origin}
        videoUrl={product.video_url}
        dimensions={product.dimensions}
        weightKg={product.weight_kg}
        materials={product.materials}
        careInstructions={product.care_instructions}
        leadTimeDays={product.lead_time_days}
        features={product.features}
        manufacturer={product.manufacturer}
        collection={product.collection}
        productSlug={product.slug}
        images={images}
        variants={variants}
        defaultVariantId={defaultVariant?.id ?? ""}
        related={related}
      />
      <SiteFooterSection />
    </div>
  );
}
