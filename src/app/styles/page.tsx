import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { StyleTiles } from "@/components/styles/style-tiles";
import { createPublicClient } from "@/lib/supabase/public";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Shop by Style — The Finishing Hub",
  description:
    "Browse Villa and Contemporary furniture and interiors collections at The Finishing Hub, Abuja.",
};

async function getStyles() {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("styles")
    .select("id, name, slug, description, hero_image_path")
    .order("display_order")
    .returns<{ id: string; name: string; slug: string; description: string | null; hero_image_path: string | null }[]>();
  return data ?? [];
}

export default async function StylesIndexPage() {
  // Confirms which styles actually exist before rendering the (currently
  // hardcoded) tile set — StyleTiles stays static content today since
  // styles.description/hero_image_path aren't populated yet, matching the
  // pattern used for category tiles elsewhere (home-data.ts, mega-menu-data.ts).
  const styles = await getStyles();

  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <div className="py-14 lg:py-20">
        <h1 className="mb-4 text-center font-serif text-3xl font-normal text-ink lg:text-[42px]">
          Find Your Style
        </h1>
        <p className="mx-auto mb-10 max-w-[560px] text-balance text-center text-[15px] leading-[1.6] text-ink/70 lg:mb-14 lg:text-base">
          Two worlds. One showroom. Choose the one that speaks to how you
          want to live.
        </p>
        {styles.length > 0 && <StyleTiles />}
        <p className="mt-10 text-center text-sm italic text-ink/50 lg:mt-14">
          More styles coming soon.
        </p>
      </div>
      <SiteFooterSection />
    </div>
  );
}
