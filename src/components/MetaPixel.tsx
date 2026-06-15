"use client";

import { useEffect } from "react";
import Script from "next/script";

// Meta Pixel client-side bootstrap. Loads fbevents.js, fires PageView
// automatically, exposes window.fbq for custom events. Pulls the Pixel
// ID from NEXT_PUBLIC_META_PIXEL_ID (safe to expose — Pixel IDs are
// public anyway since they live in the script tag).
//
// We only render the script when an ID is configured, so dev / preview
// environments without the env var are silent.
//
// NOTE: NEXT_PUBLIC_* values are inlined at BUILD time. This comment is
// bumped intentionally to invalidate the per-file build cache so a deploy
// after changing/removing the Pixel ID recompiles with the new value and
// can't keep a stale inlined ID. (Old account purged 2026-06; pixel reset.)

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function MetaPixel() {
  // Trim is defensive — Vercel's UI lets you paste values with leading/
  // trailing whitespace, which silently breaks the inline fbq('init', ...)
  // call. Empty string after trim disables the Pixel.
  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim() || "";

  // Re-fire PageView on every client-side route change. fbq is set by
  // the inline boot script below; we only call it once it exists.
  useEffect(() => {
    if (!pixelId) return;
    if (typeof window === "undefined" || !window.fbq) return;
    // The bootstrap already fires PageView on first load. This effect runs
    // on every navigation thereafter.
    window.fbq("track", "PageView");
  }, [pixelId]);

  // One-shot console warning in prod if the Pixel ID is missing — surfaces
  // the problem in DevTools instead of silently no-op'ing.
  useEffect(() => {
    if (pixelId) return;
    if (typeof window === "undefined") return;
    if (process.env.NODE_ENV !== "production") return;
    console.warn("[MetaPixel] NEXT_PUBLIC_META_PIXEL_ID is not set — Pixel disabled.");
  }, [pixelId]);

  if (!pixelId) return null;

  return (
    <>
      <Script
        id="meta-pixel-bootstrap"
        strategy="afterInteractive"
        // Standard Meta Pixel snippet, slimmed of comments.
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s){
              if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)
            }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />
      <noscript>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────
// Helpers other client components use to fire custom events.
// ──────────────────────────────────────────────────────────────────────────

type EventParams = {
  /** ZAR cents for monetary events. We pass the cents/100 to fbq. */
  value_cents?: number;
  currency?:    string;
  content_ids?: string[];
  content_name?: string;
  content_type?: string;
  num_items?:    number;
  /** Dedup with the corresponding server CAPI event. */
  event_id?:     string;
  /** Anything else the call site wants to attach. */
  [key: string]: unknown;
};

/**
 * Fire a Meta Pixel custom event. Safe to call when the pixel isn't
 * configured — becomes a no-op.
 */
export function metaPixelTrack(eventName: string, params: EventParams = {}): void {
  if (typeof window === "undefined" || !window.fbq) return;
  const { value_cents, event_id, ...rest } = params;
  const fbqParams: Record<string, unknown> = { ...rest };
  if (value_cents != null) {
    fbqParams.value    = value_cents / 100;
    fbqParams.currency = params.currency ?? "ZAR";
  }
  const opts = event_id ? { eventID: event_id } : undefined;
  if (opts) {
    window.fbq("track", eventName, fbqParams, opts);
  } else {
    window.fbq("track", eventName, fbqParams);
  }
}
