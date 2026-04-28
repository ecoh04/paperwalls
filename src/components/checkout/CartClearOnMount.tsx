"use client";

import { useEffect } from "react";
import { useCart } from "@/contexts/CartContext";

// Tiny client child for the success page. The page itself is server-
// rendered (so we can fetch the order + sign the image with no client
// round-trip) but we still need to wipe the cart. Useful as its own
// component so the rest of the page stays SSR-clean.
export function CartClearOnMount() {
  const { clearCart } = useCart();
  useEffect(() => { clearCart(); }, [clearCart]);
  return null;
}
