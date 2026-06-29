/*
 * THROWAWAY PROTOTYPE route — Variant C "Guided steps".
 *
 * Hidden, noindex/nofollow PDP-redesign concept. Not wired to
 * cart/checkout/Supabase; all CTAs are stubs. Renders only the variant body —
 * the real site header comes from the root layout. Do not ship.
 * See ../_components/NOTES.md for the writeup and the other two routes.
 */

import VariantC from "../_components/VariantC";

export const metadata = {
  title: "PaperWalls — PDP prototype (guided steps)",
  robots: { index: false, follow: false },
};

export default function PdpGuidedPrototypePage() {
  return <VariantC />;
}
