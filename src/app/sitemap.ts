import type { MetadataRoute } from "next";

// Auto-served at /sitemap.xml. List the public, indexable routes only —
// /admin, /api/*, /checkout, /cart aren't here because Google has nothing
// to do with them.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.paperwalls.co.za").replace(/\/$/, "");
  const now  = new Date();

  const routes = [
    { path: "/",                       priority: 1.0, changeFrequency: "weekly" as const },
    { path: "/shop",                   priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/shop/custom-wallpaper",  priority: 0.95, changeFrequency: "weekly" as const },
    { path: "/config",                 priority: 0.9, changeFrequency: "weekly" as const },
    { path: "/samples",                priority: 0.8, changeFrequency: "monthly" as const },
    { path: "/materials",              priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/how-it-works",           priority: 0.7, changeFrequency: "monthly" as const },
    { path: "/inspiration",            priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/about",                  priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/contact",                priority: 0.5, changeFrequency: "monthly" as const },
    { path: "/faq",                    priority: 0.6, changeFrequency: "monthly" as const },
    { path: "/shipping",               priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/returns",                priority: 0.4, changeFrequency: "yearly" as const },
    { path: "/privacy",                priority: 0.3, changeFrequency: "yearly" as const },
    { path: "/terms",                  priority: 0.3, changeFrequency: "yearly" as const },
  ];

  return routes.map(({ path, priority, changeFrequency }) => ({
    url:        `${base}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
