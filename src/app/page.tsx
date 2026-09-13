import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { Hero } from "@/components/home/hero";
import { ShopByStyle } from "@/components/home/shop-by-style";
import { NewArrivalsSection } from "@/components/home/new-arrivals-section";
import { FeaturedCategories } from "@/components/home/featured-categories";
import { ShowroomCta } from "@/components/home/showroom-cta";
import { ReassuranceStrip } from "@/components/home/reassurance-strip";

// ISR: the catalog changes rarely, and NewArrivalsSection now reads it
// through a cookie-free client (see lib/supabase/public.ts), so nothing
// left in this route's render path touches cookies()/headers() — it's
// eligible for static generation with a revalidation window instead of
// force-dynamic. See the report for the tradeoff vs. always-fresh.
export const revalidate = 3600;

export default function Home() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <Hero />
      <ShopByStyle />
      <NewArrivalsSection />
      <FeaturedCategories />
      <ShowroomCta />
      <ReassuranceStrip />
      <SiteFooterSection />
    </div>
  );
}
