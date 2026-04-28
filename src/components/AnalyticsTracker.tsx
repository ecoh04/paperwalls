"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track, installAnalyticsHandlers } from "@/lib/analytics";

// Mounted once in the marketing layout. Fires `page.viewed` on every route
// change. De-duplicates identical (pathname + search) within one page load
// because Next.js can fire two effects for the same route under React strict
// mode + transitions.

export function AnalyticsTracker() {
  const pathname = usePathname();
  const search   = useSearchParams();
  const lastPath = useRef<string | null>(null);

  // Wire visibilitychange / pagehide once per page load.
  useEffect(() => {
    installAnalyticsHandlers();
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const url = pathname + (search?.toString() ? `?${search.toString()}` : "");
    if (lastPath.current === url) return;
    lastPath.current = url;

    track("page.viewed", {
      // path comes from the lib; here we add referrer + viewport for richer
      // device-class analysis later.
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      viewport: typeof window !== "undefined"
        ? { w: window.innerWidth, h: window.innerHeight }
        : null,
      device: typeof navigator !== "undefined"
        ? (/Mobi|Android/i.test(navigator.userAgent) ? "mobile" : "desktop")
        : null,
    });
  }, [pathname, search]);

  return null;
}
