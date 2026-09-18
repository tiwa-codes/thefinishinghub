import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";

export const metadata: Metadata = {
  title: "Terms & Conditions — The Finishing Hub",
};

export default function TermsPage() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <section className="mx-auto max-w-3xl px-5 py-16 lg:py-24">
        <h1 className="mb-2 font-serif text-3xl text-ink lg:text-4xl">Terms &amp; Conditions</h1>
        <p className="mb-10 text-sm text-[#8a8073]">Last updated: September 2026</p>

        <div className="flex flex-col gap-10 text-[15px] leading-[1.8] text-[#4a4339]">
          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">Using this website</h2>
            <p>
              By using thefinishinghub.com you agree to these terms. We
              reserve the right to update them at any time.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">Orders and payment</h2>
            <p className="mb-2">
              Orders placed on this website are subject to availability and
              acceptance. We reserve the right to cancel any order and issue
              a full refund.
            </p>
            <p>
              Payment is processed securely by Paystack. All prices are in
              Nigerian Naira (₦) and include applicable taxes.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">Delivery</h2>
            <p>
              We deliver nationwide across Nigeria. Delivery timelines are
              estimates and may vary. For large items (furniture) standard
              lead time is 4–6 weeks. White-glove delivery and installation
              is available in Abuja.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">Returns and exchanges</h2>
            <p className="mb-2">
              We accept returns within 7 days of delivery for items that
              arrive damaged or not as described. Please contact us within
              48 hours of delivery with photos of any damage.
            </p>
            <p className="mb-2">Custom or made-to-order items are non-returnable.</p>
            <p>
              To initiate a return: call +234 (0) 803 311 7302 or email
              thefinishinghubng@gmail.com.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">Warranty</h2>
            <p>
              Selected furniture and sanitaryware items carry a 10-year
              warranty against manufacturing defects. Warranty details are
              shown on individual product pages.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">Intellectual property</h2>
            <p>
              All content on this website is the property of The Finishing
              Hub. Product images may include manufacturer photography used
              with permission.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">Governing law</h2>
            <p>These terms are governed by the laws of Nigeria.</p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">Contact</h2>
            <p>
              The Finishing Hub, Suites 2B–2E, AA Lukoro Plaza, Plot 1120,
              Oladipo Diya Way, Gudu District, Abuja.
              <br />
              thefinishinghubng@gmail.com
            </p>
          </div>
        </div>
      </section>
      <SiteFooterSection />
    </div>
  );
}
