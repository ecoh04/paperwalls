/** @type {import('next').NextConfig} */

// Security response headers applied to every route. Conservative set that
// can't break the app (no Content-Security-Policy yet — CSP needs a
// report-only observation pass first, since the configurator uses blob/data
// URLs and we load Supabase storage + PayFast).
const securityHeaders = [
  // Force HTTPS for 2 years, including subdomains. (HSTS)
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  // Don't let browsers MIME-sniff responses.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // We never need to be framed by another site.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // Send only the origin on cross-origin navigations.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable powerful features we don't use.
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
];

const nextConfig = {
  images: {
    // AVIF first, WebP fallback. Browsers that support neither get the JPG.
    formats: ["image/avif", "image/webp"],
    // Cache the optimized variants for 30 days at the CDN edge.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
