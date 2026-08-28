"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { ProductDetailsTab } from "@/components/admin/product-details-tab";
import { ProductVariantsTab } from "@/components/admin/product-variants-tab";
import { ProductImagesTab } from "@/components/admin/product-images-tab";

type Tab = "details" | "variants" | "images";

const TABS: Tab[] = ["details", "variants", "images"];

export default function EditProductPage() {
  const params = useParams<{ id: string }>();
  const productId = params.id;
  const [tab, setTab] = useState<Tab>("details");
  const [productName, setProductName] = useState<string | null>(null);
  const [slug, setSlug] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  async function reloadHeader() {
    const supabase = createClient();
    const { data } = await supabase
      .from("products")
      .select("name, slug")
      .eq("id", productId)
      .maybeSingle();
    if (!data) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    setProductName(data.name);
    setSlug(data.slug);
    setLoading(false);
  }

  useEffect(() => {
    reloadHeader();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  if (notFound) {
    return <p className="text-sm text-[#b3261e]">Product not found.</p>;
  }
  if (loading) {
    return <p className="text-sm text-[#8a8073]">Loading…</p>;
  }

  return (
    <div className="max-w-[880px]">
      <div className="mb-6 font-serif text-2xl text-ink">{productName}</div>
      <div className="mb-6 flex gap-1 border-b border-[#ddd5c4]">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm capitalize ${
              tab === t
                ? "border-b-2 border-forest font-medium text-forest"
                : "text-[#8a8073] hover:text-ink"
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "details" && (
        <ProductDetailsTab
          productId={productId}
          onSaved={(newSlug) => {
            setSlug(newSlug);
            reloadHeader();
          }}
        />
      )}
      {tab === "variants" && (
        <ProductVariantsTab productId={productId} productSlug={slug} />
      )}
      {tab === "images" && (
        <ProductImagesTab
          productId={productId}
          productSlug={slug}
          productName={productName ?? ""}
        />
      )}
    </div>
  );
}
