import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { Hero } from "@/components/home/hero";
import { ShopByRoom } from "@/components/home/shop-by-room";
import { ShopByCategory } from "@/components/home/shop-by-category";
import { NewArrivalsSection } from "@/components/home/new-arrivals-section";
import { RoomEditorial } from "@/components/home/room-editorial";
import { DesignServices } from "@/components/home/design-services";
import { TradeDesk } from "@/components/home/trade-desk";
import { ProjectsGallery } from "@/components/home/projects-gallery";
import { VisitShowroom } from "@/components/home/visit-showroom";
import { Newsletter } from "@/components/home/newsletter";

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
      <ShopByRoom />
      <ShopByCategory />
      <NewArrivalsSection />
      <RoomEditorial />
      <DesignServices />
      <TradeDesk />
      <ProjectsGallery />
      <VisitShowroom />
      <Newsletter />
      <SiteFooterSection />
    </div>
  );
}
