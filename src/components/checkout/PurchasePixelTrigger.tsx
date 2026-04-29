"use client";

import { useEffect } from "react";
import { metaPixelTrack } from "@/components/MetaPixel";

// Fires the Meta Pixel Purchase event once on mount. event_id is derived
// from the joined order numbers so the matching server-side CAPI Purchase
// (fired by the PayFast webhook) dedups against this exact pixel event.
//
// Server-rendered success page passes the data; this client child fires
// the actual pixel call.

type Props = {
  orderNumbers: string[];
  valueCents:   number;
  numItems:     number;
};

function purchaseEventId(orderNumbers: string[]): string {
  return `purchase:${[...orderNumbers].sort().join(",")}`;
}

export function PurchasePixelTrigger({ orderNumbers, valueCents, numItems }: Props) {
  useEffect(() => {
    if (orderNumbers.length === 0) return;
    metaPixelTrack("Purchase", {
      event_id:    purchaseEventId(orderNumbers),
      value_cents: valueCents,
      currency:    "ZAR",
      num_items:   numItems,
      content_type: "product",
      content_ids:  orderNumbers,
    });
  }, [orderNumbers, valueCents, numItems]);

  return null;
}

// Exported so the server-side CAPI fire can compute the matching event_id.
export { purchaseEventId };
