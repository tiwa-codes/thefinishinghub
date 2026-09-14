"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CollectionForm } from "@/components/admin/collection-form";

type CollectionDetails = {
  name: string;
  slug: string;
  description: string | null;
  image_url: string;
  display_order: number;
};

export default function EditCollectionPage() {
  const params = useParams<{ id: string }>();
  const collectionId = params.id;
  const [initial, setInitial] = useState<{
    name: string;
    slug: string;
    description: string;
    imageUrl: string;
    displayOrder: string;
  } | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("collections")
        .select("name, slug, description, image_url, display_order")
        .eq("id", collectionId)
        .returns<CollectionDetails[]>()
        .maybeSingle();
      if (!data) {
        setNotFound(true);
        return;
      }
      setInitial({
        name: data.name,
        slug: data.slug,
        description: data.description ?? "",
        imageUrl: data.image_url,
        displayOrder: String(data.display_order),
      });
    }
    load();
  }, [collectionId]);

  if (notFound) return <p className="text-sm text-[#b3261e]">Collection not found.</p>;
  if (!initial) return <p className="text-sm text-[#8a8073]">Loading…</p>;

  return (
    <div>
      <div className="mb-6 font-serif text-2xl text-ink">{initial.name}</div>
      <CollectionForm collectionId={collectionId} initial={initial} />
    </div>
  );
}
