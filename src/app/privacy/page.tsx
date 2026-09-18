import type { Metadata } from "next";
import { SiteNavSection } from "@/components/site-nav-section";
import { SiteFooterSection } from "@/components/site-footer-section";

export const metadata: Metadata = {
  title: "Privacy Policy — The Finishing Hub",
};

export default function PrivacyPage() {
  return (
    <div className="bg-cream font-sans text-ink antialiased">
      <SiteNavSection />
      <section className="mx-auto max-w-3xl px-5 py-16 lg:py-24">
        <h1 className="mb-2 font-serif text-3xl text-ink lg:text-4xl">Privacy Policy</h1>
        <p className="mb-10 text-sm text-[#8a8073]">Last updated: September 2026</p>

        <div className="flex flex-col gap-10 text-[15px] leading-[1.8] text-[#4a4339]">
          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">Who we are</h2>
            <p>
              The Finishing Hub is a furniture, tiles and interiors showroom
              based in Abuja, Nigeria. Our website is at thefinishinghub.com.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">What data we collect</h2>
            <p className="mb-2">
              When you place an order: your name, email address, phone
              number, and delivery address.
            </p>
            <p className="mb-2">
              When you contact us or submit an enquiry: your name, email,
              phone, and the details you provide.
            </p>
            <p>
              When you browse: standard web analytics data (page visits,
              device type, referring pages). We use this to improve the site.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">How we use it</h2>
            <p className="mb-2">To fulfil and track your orders.</p>
            <p className="mb-2">To contact you about your order or enquiry.</p>
            <p className="mb-2">To improve our website and product offering.</p>
            <p className="mb-2">We do not sell your data to third parties.</p>
            <p>
              We do not use your data for unsolicited marketing without your
              consent.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">Payments</h2>
            <p>
              Payments are processed by Paystack. We never store your card
              details. Paystack&apos;s privacy policy is available at
              paystack.com.
            </p>
          </div>

          <div>
            <h2 className="mb-3 font-serif text-xl text-ink">Your rights (NDPA 2023)</h2>
            <p>
              Under the Nigeria Data Protection Act 2023 you have the right
              to access, correct or request deletion of your personal data.
              Contact us at thefinishinghubng@gmail.com or +234 (0) 803 311
              7302.
            </p>
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
