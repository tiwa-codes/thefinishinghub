import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Hero } from "@/components/home/hero";
import { ShopByRoom } from "@/components/home/shop-by-room";
import { ShopByCategory } from "@/components/home/shop-by-category";
import { NewArrivals } from "@/components/home/new-arrivals";
import { RoomEditorial } from "@/components/home/room-editorial";
import { DesignServices } from "@/components/home/design-services";
import { TradeDesk } from "@/components/home/trade-desk";
import { ProjectsGallery } from "@/components/home/projects-gallery";
import { VisitShowroom } from "@/components/home/visit-showroom";
import { Newsletter } from "@/components/home/newsletter";

export default function Home() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNav />
      <Hero />
      <ShopByRoom />
      <ShopByCategory />
      <NewArrivals />
      <RoomEditorial />
      <DesignServices />
      <TradeDesk />
      <ProjectsGallery />
      <VisitShowroom />
      <Newsletter />
      <SiteFooter />
    </div>
  );
}
