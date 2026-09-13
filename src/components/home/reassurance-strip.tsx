function ShieldIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z"></path>
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M3 12h18M12 3c2.5 2.5 4 5.8 4 9s-1.5 6.5-4 9c-2.5-2.5-4-5.8-4-9s1.5-6.5 4-9Z"></path>
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4.5 4.5h4l1.5 4.5-2 1.5a12 12 0 0 0 6 6l1.5-2 4.5 1.5v4a1 1 0 0 1-1 1C10.5 21 3 13.5 3 5.5a1 1 0 0 1 1-1Z"></path>
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"></path>
      <circle cx="12" cy="9" r="2.5"></circle>
    </svg>
  );
}

const REASSURANCE_ITEMS = [
  {
    Icon: ShieldIcon,
    heading: "10-Year Warranty",
    description: "On selected furniture and sanitaryware products",
  },
  {
    Icon: GlobeIcon,
    heading: "Authentic Origins",
    description: "Italian, French, and NBH-crafted pieces, certified and verified",
  },
  {
    Icon: PhoneIcon,
    heading: "Expert Guidance",
    description: "Speak to our team before you buy — we're here to help",
  },
  {
    Icon: MapPinIcon,
    heading: "Abuja Showroom",
    description: "Visit us in person and see every piece before it arrives in your home",
  },
];

export function ReassuranceStrip() {
  return (
    <section className="border-y border-ink/10 bg-cream">
      <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-x-6 gap-y-10 px-5 py-12 lg:grid-cols-4 lg:gap-8 lg:px-10 lg:py-16">
        {REASSURANCE_ITEMS.map((item) => (
          <div key={item.heading} className="flex flex-col items-start gap-3">
            <span className="text-forest">
              <item.Icon />
            </span>
            <div className="text-[15px] font-semibold text-ink lg:text-base">
              {item.heading}
            </div>
            <p className="text-[13px] leading-[1.5] text-ink/65 lg:text-sm">
              {item.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
