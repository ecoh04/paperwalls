import type { MetadataRoute } from "next";

// Auto-served at /robots.txt. Allow everything except admin, the
// checkout-success page (no canonical content; just a personalised
// thank-you), the cart, and API routes.
export default function robots(): MetadataRoute.Robots {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.paperwalls.co.za").replace(/\/$/, "");

  return {
    rules: [
      {
        userAgent: "*",
        allow:     "/",
        disallow:  ["/admin", "/admin/", "/api/", "/cart", "/checkout"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host:    base,
  };
}
