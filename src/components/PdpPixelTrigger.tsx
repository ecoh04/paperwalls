"use client";

import { useEffect } from "react";
import { metaPixelTrack } from "@/components/MetaPixel";
import { track } from "@/lib/analytics";

// Fires on PDP render:
//  1. First-party pdp.viewed — the cold-traffic landing step. Without this
//     the funnel can only see generic page.viewed and can't measure the
//     ad -> PDP -> configurator drop-off, the key cold-traffic transition.
//  2. Meta Pixel ViewContent — retargeting audiences ('viewed but didn't
//     buy'). No CAPI mirror — view events are less load-bearing than
//     conversion events, and Meta is OK with pixel-only for ViewContent.

export function PdpPixelTrigger() {
  useEffect(() => {
    track("pdp.viewed", { product: "custom_wallpaper" });
    metaPixelTrack("ViewContent", {
      content_type: "product",
      content_ids:  ["custom_wallpaper"],
      content_name: "Custom wallpaper",
    });
  }, []);
  return null;
}
