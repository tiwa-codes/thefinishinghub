import { ListingBreadcrumb, type BreadcrumbCrumb } from "./listing-breadcrumb";
import { FilterBar } from "./filter-bar";
import { ListingProductGrid, type ListingProduct } from "./listing-product-grid";

export function ListingView({
  breadcrumb,
  title,
  description,
  products,
  emptyMessage,
}: {
  breadcrumb: BreadcrumbCrumb[];
  title: string;
  description: string;
  products: ListingProduct[];
  emptyMessage: string;
}) {
  const countLabel = `${products.length} ${products.length === 1 ? "piece" : "pieces"}`;

  return (
    <>
      <section className="mx-auto max-w-[1440px] px-5 pt-8 lg:px-10 lg:pt-11">
        <ListingBreadcrumb crumbs={breadcrumb} />
        <h1 className="mb-2 font-serif text-3xl font-normal text-ink lg:text-[40px]">
          {title}
        </h1>
        <p className="max-w-[560px] text-[15px] text-[#6b6155]">{description}</p>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pt-7 lg:px-10">
        <FilterBar countLabel={countLabel} />
      </section>

      <section className="mx-auto max-w-[1440px] px-5 pt-9 pb-12 lg:px-10 lg:pb-24">
        <ListingProductGrid products={products} emptyMessage={emptyMessage} />
      </section>
    </>
  );
}
