import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  image_url: string;
};

export default async function AdminCollectionsPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("collections")
    .select("id, name, slug, image_url")
    .order("display_order")
    .returns<CollectionRow[]>();

  const collections = data ?? [];

  return (
    <div className="max-w-[820px]">
      <div className="mb-6 flex items-center justify-between">
        <div className="font-serif text-2xl text-ink">Collections</div>
        <Link
          href="/admin/collections/new"
          className="rounded-[2px] bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-deep-forest"
        >
          New collection
        </Link>
      </div>
      <div className="overflow-x-auto rounded-[2px] border border-[#ddd5c4] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddd5c4] text-xs uppercase tracking-[0.06em] text-[#8a8073]">
              <th className="px-3 py-2.5 font-medium">Image</th>
              <th className="px-3 py-2.5 font-medium">Name</th>
              <th className="px-3 py-2.5 font-medium">Slug</th>
              <th className="px-3 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee7d8]">
            {collections.map((c) => (
              <tr key={c.id}>
                <td className="px-3 py-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-[2px] bg-[#eee7d8]">
                    <Image src={c.image_url} alt="" fill sizes="40px" className="object-cover" />
                  </div>
                </td>
                <td className="px-3 py-2 text-ink">{c.name}</td>
                <td className="px-3 py-2 font-mono text-[#6b6155]">{c.slug}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/collections/${c.id}`}
                    className="text-xs font-medium text-forest hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {collections.length === 0 && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[#8a8073]">
                  No collections yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
