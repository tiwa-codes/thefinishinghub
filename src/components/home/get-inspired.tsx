import { createPublicClient } from "@/lib/supabase/public";
import { LooksRow, type LookCard } from "./looks-row";

type LookRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  image_url: string;
  styles: { name: string } | null;
};

type LookProductRow = {
  look_id: string;
  products: { name: string } | null;
};

export async function GetInspired() {
  const supabase = createPublicClient();

  const { data: lookRows, error } = await supabase
    .from("looks")
    .select("id, slug, title, description, image_url, styles ( name )")
    .order("display_order")
    .returns<LookRow[]>();

  if (error) {
    console.error("Failed to load looks:", error.message);
  }

  const looks = lookRows ?? [];
  if (looks.length === 0) return null;

  // Small, fixed set of looks on the homepage (4 today) — one query per
  // look for its top-3 product names is simpler and clearer than a manual
  // window-function batch for a list this size.
  const { data: productRows } = await supabase
    .from("look_products")
    .select("look_id, products ( name ), display_order")
    .in(
      "look_id",
      looks.map((l) => l.id),
    )
    .order("display_order")
    .returns<(LookProductRow & { display_order: number })[]>();

  const namesByLook = new Map<string, string[]>();
  for (const row of productRows ?? []) {
    if (!row.products) continue;
    const existing = namesByLook.get(row.look_id) ?? [];
    if (existing.length < 3) {
      existing.push(row.products.name);
      namesByLook.set(row.look_id, existing);
    }
  }

  const cards: LookCard[] = looks.map((look) => ({
    id: look.id,
    slug: look.slug,
    title: look.title,
    description: look.description,
    imageUrl: look.image_url,
    styleName: look.styles?.name ?? null,
    productNames: namesByLook.get(look.id) ?? [],
  }));

  return (
    <section className="bg-cream py-14 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <LooksRow looks={cards} />
      </div>
    </section>
  );
}
