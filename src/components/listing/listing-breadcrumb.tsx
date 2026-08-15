import Link from "next/link";

export type BreadcrumbCrumb = {
  label: string;
  href?: string; // omitted for the current page
};

export function ListingBreadcrumb({ crumbs }: { crumbs: BreadcrumbCrumb[] }) {
  return (
    <div className="mb-[22px] font-mono text-[11px] tracking-[0.08em] text-[#8a8073]">
      {crumbs.map((crumb, i) => (
        <span key={crumb.label}>
          {crumb.href ? (
            <Link href={crumb.href} className="text-[#8a8073] no-underline">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-ink">{crumb.label}</span>
          )}
          {i < crumbs.length - 1 && <span className="mx-2">/</span>}
        </span>
      ))}
    </div>
  );
}
