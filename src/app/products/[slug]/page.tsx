import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { ProductDetailView } from "@/components/product-detail/product-detail-view";
import type { GalleryImage } from "@/components/product-detail/product-gallery";
import type { ProductVariantOption } from "@/components/product-detail/variant-picker";
import type { FeaturedProduct } from "@/components/category/featured-products-grid";
import { createPublicClient } from "@/lib/supabase/public";
import { hrefForSubcategorySlug } from "@/lib/categories";
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
  categories: { id: string; slug: string; name: string; parent_id: string | null } | null;
  // public_product_variants, not product_variants — this is the only
  // variant-price path public-facing code may read from. It nulls
  // price_kobo for a requires_quote product; the actual security
  // boundary lives in that view, not here.
  public_product_variants: {
    id: string;
    sku: string;
    finish: string | null;
    color: string | null;
    size: string | null;
    price_kobo: number | null;
    is_default: boolean;
    requires_quote: boolean;
  }[];
  product_images: {
    url: string;
    alt_text: string | null;
    is_primary: boolean;
    display_order: number;
  }[];
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
      categories ( id, slug, name, parent_id ),
      public_product_variants ( id, sku, finish, color, size, price_kobo, is_default, requires_quote ),
      product_images ( url, alt_text, is_primary, display_order )
    `,
    )
    .eq("slug", slug)
    .eq("status", "published")
    .returns<ProductRow[]>()
    .maybeSingle();

  return data;
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

async function getComplements(excludeId: string): Promise<FeaturedProduct[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select(
      `
      id,
      slug,
      name,
      categories ( name ),
      public_product_variants!inner ( id, price_kobo, is_default, requires_quote ),
      product_images ( url, alt_text, is_primary )
    `,
    )
    .eq("status", "published")
    .eq("public_product_variants.is_default", true)
    .neq("id", excludeId)
    .order("created_at", { ascending: false })
    .limit(4)
    .returns<
      {
        id: string;
        slug: string;
        name: string;
        categories: { name: string } | null;
        public_product_variants: {
          id: string;
          price_kobo: number | null;
          is_default: boolean;
          requires_quote: boolean;
        }[];
        product_images: { url: string; alt_text: string | null; is_primary: boolean }[];
      }[]
    >();

  return (data ?? []).map((row) => {
    const variant = row.public_product_variants[0];
    const primaryImage =
      row.product_images.find((img) => img.is_primary) ??
      row.product_images[0] ??
      null;
    return {
      id: row.id,
      slug: row.slug,
      name: row.name,
      categoryLabel: row.categories?.name ?? "",
      priceKobo: variant?.price_kobo ?? null,
      requiresQuote: variant?.requires_quote ?? false,
      imageUrl: primaryImage?.url ?? null,
      imageAlt: primaryImage?.alt_text ?? row.name,
    };
  });
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
    description: product.short_description ?? undefined,
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

  const parentCategory = product.categories?.parent_id
    ? await getParentCategory(product.categories.parent_id)
    : null;
  const categoryPath = [parentCategory?.name, product.categories?.name]
    .filter(Boolean)
    .join(" · ");

  // Generic across every category, not just Furniture: a subcategory
  // product gets parent-crumb (real href) + subcategory-crumb (real href
  // only where that listing page is actually built, per
  // hrefForSubcategorySlug — plain text otherwise). A product whose own
  // category IS top-level (no parent) gets a single category crumb.
  const breadcrumb: BreadcrumbCrumb[] = [{ label: "Home", href: "/" }];
  if (parentCategory && product.categories) {
    breadcrumb.push({ label: parentCategory.name, href: `/${parentCategory.slug}` });
    const subcategoryHref = hrefForSubcategorySlug(product.categories.slug);
    breadcrumb.push({
      label: product.categories.name,
      href: subcategoryHref !== "#" ? subcategoryHref : undefined,
    });
  } else if (product.categories) {
    breadcrumb.push({ label: product.categories.name, href: `/${product.categories.slug}` });
  }
  breadcrumb.push({ label: product.name });

  const images: GalleryImage[] = [...product.product_images]
    .sort((a, b) => {
      if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
      return a.display_order - b.display_order;
    })
    .map((img) => ({ url: img.url, alt: img.alt_text ?? product.name }));

  const defaultVariant =
    product.public_product_variants.find((v) => v.is_default) ??
    product.public_product_variants[0];

  const variants: ProductVariantOption[] = product.public_product_variants.map((v) => ({
    id: v.id,
    label: v.finish ?? v.color ?? v.size ?? v.sku,
    swatchColor: v.color,
  }));

  const complements = await getComplements(product.id);

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <ProductDetailView
        productId={product.id}
        breadcrumb={breadcrumb}
        categoryPath={categoryPath}
        name={product.name}
        priceKobo={defaultVariant?.price_kobo ?? null}
        requiresQuote={defaultVariant?.requires_quote ?? false}
        description={product.description ?? product.short_description ?? ""}
        images={images}
        variants={variants}
        defaultVariantId={defaultVariant?.id ?? ""}
        complements={complements}
      />
      <SiteFooterSection />
    </div>
  );
}
