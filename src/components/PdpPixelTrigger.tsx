"use client";

import { useEffect } from "react";
import { metaPixelTrack } from "@/components/MetaPixel";

// Fires Meta Pixel ViewContent when the PDP renders. Used for retargeting
// audiences ('viewed but didn't buy'). No CAPI mirror — view events are
// less load-bearing than conversion events, and Meta is OK with pixel-only
// for ViewContent at our scale.

export function PdpPixelTrigger() {
  useEffect(() => {
    metaPixelTrack("ViewContent", {
      content_type: "product",
      content_ids:  ["custom_wallpaper"],
      content_name: "Custom wallpaper",
    });
  }, []);
  return null;
}
