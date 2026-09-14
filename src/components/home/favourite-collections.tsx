import Image from "next/image";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public";
import { UNSPLASH_BLUR_DATA_URL } from "@/lib/unsplash";

type CollectionRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string;
};

export async function FavouriteCollections() {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("collections")
    .select("id, name, slug, description, image_url")
    .order("display_order")
    .limit(3)
    .returns<CollectionRow[]>();

  if (error) {
    console.error("Failed to load collections:", error.message);
  }

  const collections = data ?? [];
  if (collections.length === 0) return null;

  return (
    <section className="bg-cream py-14 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 lg:px-10">
        <h2 className="mb-10 text-center font-serif text-2xl font-normal text-ink lg:mb-14 lg:text-[34px]">
          Our Favourite <em className="italic">Collections</em>
        </h2>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.slug}`}
              className="block no-underline"
            >
              <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-[3px] bg-[#e2dccf]">
                <Image
                  src={collection.image_url}
                  alt={collection.name}
                  fill
                  sizes="(min-width: 1024px) 33vw, 100vw"
                  placeholder="blur"
                  blurDataURL={UNSPLASH_BLUR_DATA_URL}
                  className="object-cover"
                />
              </div>
              <div className="mb-2 font-serif text-xl text-ink">{collection.name}</div>
              {collection.description && (
                <p className="line-clamp-2 text-sm text-[#6b6155]">{collection.description}</p>
              )}
              <span className="mt-2 inline-block text-sm font-medium text-gold">
                Shop the collection →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
