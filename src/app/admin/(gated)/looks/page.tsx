import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

type LookRow = {
  id: string;
  title: string;
  image_url: string;
  is_featured: boolean;
  styles: { name: string } | null;
  look_products: { id: string }[];
};

export default async function AdminLooksPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("looks")
    .select("id, title, image_url, is_featured, styles ( name ), look_products ( id )")
    .order("display_order")
    .returns<LookRow[]>();

  const looks = data ?? [];

  return (
    <div className="max-w-[960px]">
      <div className="mb-6 flex items-center justify-between">
        <div className="font-serif text-2xl text-ink">Looks</div>
        <Link
          href="/admin/looks/new"
          className="rounded-[2px] bg-forest px-4 py-2 text-sm font-medium text-cream hover:bg-deep-forest"
        >
          New look
        </Link>
      </div>
      <div className="overflow-x-auto rounded-[2px] border border-[#ddd5c4] bg-white">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#ddd5c4] text-xs uppercase tracking-[0.06em] text-[#8a8073]">
              <th className="px-3 py-2.5 font-medium">Image</th>
              <th className="px-3 py-2.5 font-medium">Title</th>
              <th className="px-3 py-2.5 font-medium">Style</th>
              <th className="px-3 py-2.5 font-medium">Products</th>
              <th className="px-3 py-2.5 font-medium">Featured</th>
              <th className="px-3 py-2.5 font-medium" />
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eee7d8]">
            {looks.map((look) => (
              <tr key={look.id}>
                <td className="px-3 py-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-[2px] bg-[#eee7d8]">
                    <Image src={look.image_url} alt="" fill sizes="40px" className="object-cover" />
                  </div>
                </td>
                <td className="px-3 py-2 text-ink">{look.title}</td>
                <td className="px-3 py-2 text-[#6b6155]">{look.styles?.name ?? "—"}</td>
                <td className="px-3 py-2 text-[#6b6155]">{look.look_products.length}</td>
                <td className="px-3 py-2 text-[#6b6155]">{look.is_featured ? "Yes" : "No"}</td>
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/looks/${look.id}`}
                    className="text-xs font-medium text-forest hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {looks.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-[#8a8073]">
                  No looks yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
