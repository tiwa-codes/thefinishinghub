/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ycvjjyzydgbigqytsnsa.supabase.co",
        pathname: "/storage/v1/object/public/product-images/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async redirects() {
    // The old Living Room/Dining/Workspace/Office furniture subcategories
    // were deleted from the categories table in
    // 20260913120000_full_ia_restructure.sql. None of
    // their would-be replacement subcategories (sofas, coffee-side-tables,
    // dining-tables-chairs, office-seating, office-desks-suites, etc.) have
    // a built page route yet, so these fall back to the parent /furniture
    // listing rather than a specific subcategory page.
    return [
      {
        source: "/furniture/living",
        destination: "/furniture",
        permanent: true,
      },
      {
        source: "/furniture/dining",
        destination: "/furniture",
        permanent: true,
      },
      {
        source: "/furniture/workspace",
        destination: "/furniture",
        permanent: true,
      },
      {
        source: "/furniture/office",
        destination: "/furniture",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
