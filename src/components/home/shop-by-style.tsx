import { StyleTiles } from "@/components/styles/style-tiles";

export function ShopByStyle() {
  return (
    <section className="bg-cream py-14 lg:py-20">
      <h2 className="mb-10 text-center font-serif text-2xl font-normal text-ink lg:mb-14 lg:text-[34px]">
        Find Your Style
      </h2>
      <StyleTiles />
    </section>
  );
}
