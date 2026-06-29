/*
 * THROWAWAY PROTOTYPE route — Variant A "Samples-first".
 *
 * Hidden, noindex/nofollow PDP-redesign concept. Not wired to
 * cart/checkout/Supabase; all CTAs are stubs. Renders only the variant body —
 * the real site header comes from the root layout. Do not ship.
 * See ../_components/NOTES.md for the writeup and the other two routes.
 */

import VariantA from "../_components/VariantA";

export const metadata = {
  title: "PaperWalls — PDP prototype (samples-first)",
  robots: { index: false, follow: false },
};

export default function PdpSamplesPrototypePage() {
  return <VariantA />;
}
