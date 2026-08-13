"use client";

export function Newsletter() {
  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[780px] px-5 py-14 text-center lg:px-10 lg:py-[84px]">
        <h2 className="mb-3 font-serif text-xl font-normal text-ink lg:text-[28px]">
          New arrivals, projects and showroom news.
        </h2>
        <p className="mb-7 text-[15px] text-[#6b6155]">
          A quiet note now and then. No more than monthly.
        </p>
        <form
          onSubmit={(e) => e.preventDefault()}
          className="mx-auto flex max-w-[480px] flex-col gap-2.5 sm:flex-row"
        >
          <input
            type="email"
            placeholder="Email address"
            className="flex-1 rounded-[2px] border border-[#cfc6b6] bg-white px-4 py-3.5 font-sans text-sm text-ink outline-none"
          />
          <button
            type="submit"
            className="rounded-[2px] bg-forest px-[26px] py-3.5 font-sans text-sm font-semibold tracking-wide text-cream hover:bg-deep-forest"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
}
