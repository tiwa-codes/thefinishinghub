import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";
import { WishlistView } from "@/components/wishlist-view";

export const metadata: Metadata = {
  title: "Your Wishlist — The Finishing Hub",
};

export default function WishlistPage() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <WishlistView />
      <SiteFooterSection />
    </div>
  );
}
