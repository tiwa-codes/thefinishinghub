import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { SubcategoryListingView } from "@/components/category/subcategory-listing-view";
import { getSubcategoryPageData, getSubcategoryStaticParams } from "@/lib/subcategory-page-data";

const TOP_LEVEL_SLUG = "lighting";

export const revalidate = 3600;

export async function generateStaticParams() {
  return getSubcategoryStaticParams(TOP_LEVEL_SLUG);
}

export async function generateMetadata({
  params,
}: {
  params: { subcategorySlug: string };
}): Promise<Metadata> {
  const { subcategory, parent } = await getSubcategoryPageData(TOP_LEVEL_SLUG, params.subcategorySlug);
  if (!subcategory) return {};
  return {
    title: `${subcategory.name} — ${parent?.name ?? "The Finishing Hub"}`,
    description: `Shop ${subcategory.name} at The Finishing Hub.`,
  };
}

export default async function LightingSubcategoryPage({
  params,
}: {
  params: { subcategorySlug: string };
}) {
  const { subcategory, parent, siblings, products } = await getSubcategoryPageData(
    TOP_LEVEL_SLUG,
    params.subcategorySlug,
  );
  if (!subcategory || !parent) {
    notFound();
  }

  return (
    <>
      <SiteNavSection />
      <SubcategoryListingView
        parentName={parent.name}
        parentSlug={parent.slug}
        subcategoryName={subcategory.name}
        siblings={siblings}
        activeSlug={subcategory.slug}
        showAttributeFilters={false}
        products={products}
      />
      <SiteFooterSection />
    </>
  );
}
