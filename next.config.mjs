/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // AVIF first, WebP fallback. Browsers that support neither get the JPG.
    formats: ["image/avif", "image/webp"],
    // Cache the optimized variants for 30 days at the CDN edge.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
