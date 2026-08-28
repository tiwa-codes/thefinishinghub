"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { revalidateAdminPaths } from "@/lib/admin/revalidate";

type ProductImage = {
  id: string;
  url: string;
  alt_text: string | null;
  is_primary: boolean;
  display_order: number;
};

const STORAGE_PUBLIC_PREFIX = "/storage/v1/object/public/product-images/";

// Legacy seed data uses local /images/*.jpg paths with no storage object
// behind them — only urls that actually came from the bucket have a path
// to remove.
function storagePathFromUrl(url: string): string | null {
  const idx = url.indexOf(STORAGE_PUBLIC_PREFIX);
  if (idx === -1) return null;
  return url.slice(idx + STORAGE_PUBLIC_PREFIX.length);
}

export function ProductImagesTab({
  productId,
  productSlug,
  productName,
}: {
  productId: string;
  productSlug: string | null;
  productName: string;
}) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragId = useRef<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function load() {
    const supabase = createClient();
    const { data } = await supabase
      .from("product_images")
      .select("id, url, alt_text, is_primary, display_order")
      .eq("product_id", productId)
      .order("display_order")
      .returns<ProductImage[]>();
    setImages(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  async function revalidatePdp() {
    if (productSlug) await revalidateAdminPaths([`/products/${productSlug}`]);
  }

  async function handleUpload(file: File) {
    setUploading(true);
    setError(null);
    const supabase = createClient();
    const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
    const path = `${productId}/${crypto.randomUUID()}-${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from("product-images")
      .upload(path, file);
    if (uploadErr) {
      setUploading(false);
      setError(uploadErr.message);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(path);
    const nextOrder =
      images.length > 0 ? Math.max(...images.map((i) => i.display_order)) + 1 : 0;

    const { data: row, error: insertErr } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        url: publicUrl,
        alt_text: productName,
        is_primary: images.length === 0,
        display_order: nextOrder,
      })
      .select("id, url, alt_text, is_primary, display_order")
      .single();

    setUploading(false);
    if (insertErr || !row) {
      setError(
        insertErr?.message ?? "Upload succeeded but saving the image record failed.",
      );
      return;
    }

    setImages((prev) => [...prev, row]);
    await revalidatePdp();
  }

  async function handleSetPrimary(id: string) {
    const supabase = createClient();
    await supabase
      .from("product_images")
      .update({ is_primary: false })
      .eq("product_id", productId);
    await supabase.from("product_images").update({ is_primary: true }).eq("id", id);
    setImages((prev) => prev.map((img) => ({ ...img, is_primary: img.id === id })));
    await revalidatePdp();
  }

  async function handleDelete(image: ProductImage) {
    if (!window.confirm("Delete this photo?")) return;
    const supabase = createClient();
    const storagePath = storagePathFromUrl(image.url);
    if (storagePath) {
      await supabase.storage.from("product-images").remove([storagePath]);
    }
    await supabase.from("product_images").delete().eq("id", image.id);

    const remaining = images.filter((img) => img.id !== image.id);
    setImages(remaining);

    if (image.is_primary && remaining.length > 0) {
      await handleSetPrimary(remaining[0].id);
    } else {
      await revalidatePdp();
    }
  }

  async function persistOrder(next: ProductImage[]) {
    const supabase = createClient();
    await Promise.all(
      next.map((img, idx) =>
        supabase.from("product_images").update({ display_order: idx }).eq("id", img.id),
      ),
    );
    await revalidatePdp();
  }

  function handleDrop(targetId: string) {
    const sourceId = dragId.current;
    dragId.current = null;
    if (!sourceId || sourceId === targetId) return;

    setImages((prev) => {
      const sourceIndex = prev.findIndex((i) => i.id === sourceId);
      const targetIndex = prev.findIndex((i) => i.id === targetId);
      if (sourceIndex === -1 || targetIndex === -1) return prev;
      const next = [...prev];
      const [moved] = next.splice(sourceIndex, 1);
      next.splice(targetIndex, 0, moved);
      const reindexed = next.map((img, idx) => ({ ...img, display_order: idx }));
      persistOrder(reindexed);
      return reindexed;
    });
  }

  if (loading) return <p className="text-sm text-[#8a8073]">Loading…</p>;

  return (
    <div>
      <div className="mb-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-[2px] border border-forest px-4 py-2 text-sm font-medium text-forest hover:bg-forest hover:text-cream disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? "Uploading…" : "Upload photo"}
        </button>
        {error && <p className="mt-2 text-[13px] text-[#b3261e]">{error}</p>}
      </div>

      {images.length === 0 ? (
        <p className="text-sm text-[#8a8073]">No photos yet.</p>
      ) : (
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-6">
          {images.map((img) => (
            <div
              key={img.id}
              draggable
              onDragStart={() => {
                dragId.current = img.id;
              }}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => handleDrop(img.id)}
              className="group relative cursor-move overflow-hidden border-2 bg-[#e2dccf]"
              style={{
                aspectRatio: "1 / 1",
                borderColor: img.is_primary ? "#0d3d28" : "#ddd5c4",
              }}
            >
              <Image
                src={img.url}
                alt={img.alt_text ?? ""}
                fill
                sizes="160px"
                className="object-cover"
              />
              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-black/60 px-1.5 py-1 opacity-0 group-hover:opacity-100">
                {!img.is_primary && (
                  <button
                    type="button"
                    onClick={() => handleSetPrimary(img.id)}
                    className="text-[10px] font-medium text-white hover:underline"
                  >
                    Set primary
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleDelete(img)}
                  className="ml-auto text-[10px] font-medium text-white hover:underline"
                >
                  Delete
                </button>
              </div>
              {img.is_primary && (
                <span className="absolute left-1 top-1 rounded-[2px] bg-forest px-1.5 py-0.5 text-[9px] font-medium text-cream">
                  Primary
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      <p className="mt-3 text-[11px] text-[#8a8073]">Drag to reorder.</p>
    </div>
  );
}
