import type { WallpaperStyle, ApplicationMethod } from "@/types/order";

/** Base price per m² in ZAR cents. Tiers by total m². */
const BASE_PRICE_PER_SQM_CENTS: { minSqm: number; centsPerSqm: number }[] = [
  { minSqm: 20, centsPerSqm: 40000 },   // R400/m² for 20+
  { minSqm: 10, centsPerSqm: 45000 },   // R450/m² for 10–20
  { minSqm: 5, centsPerSqm: 55000 },   // R550/m² for 5–10
  { minSqm: 0, centsPerSqm: 65000 },   // R650/m² for 0–5
];

/** Material multiplier (1 = base price). */
export const STYLE_MULTIPLIERS: Record<WallpaperStyle, number> = {
  matte: 1,
  satin: 1.15,
  textured: 1.25,
  premium: 1.4,
};

/** Installation add-on in ZAR cents (fixed: not tied to m²). */
export const APPLICATION_ADDON_CENTS: Record<ApplicationMethod, number> = {
  diy: 0,           // FREE
  diy_kit: 50000,   // R500
  installer: 150000, // R1,500
};

function getBaseCentsPerSqm(totalSqm: number): number {
  const tier = BASE_PRICE_PER_SQM_CENTS.find((t) => totalSqm >= t.minSqm);
  return tier ? tier.centsPerSqm : BASE_PRICE_PER_SQM_CENTS[0].centsPerSqm;
}

/** Wallpaper only (m² × base × style), no installation add-on. */
export function calculateWallpaperCents(totalSqm: number, style: WallpaperStyle): number {
  if (totalSqm <= 0) return 0;
  const basePerSqm = getBaseCentsPerSqm(totalSqm);
  const materialMultiplier = STYLE_MULTIPLIERS[style];
  return Math.round(totalSqm * basePerSqm * materialMultiplier);
}

/**
 * Full subtotal (before shipping) in ZAR cents.
 * Wallpaper + installation add-on.
 */
export function calculateSubtotalCents(
  totalSqm: number,
  style: WallpaperStyle,
  application: ApplicationMethod
): number {
  return calculateWallpaperCents(totalSqm, style) + APPLICATION_ADDON_CENTS[application];
}

/** Format ZAR cents as "R 1 234.56" for display. */
export function formatZar(cents: number): string {
  const rands = cents / 100;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rands);
}
