/**
 * Single source of truth for image-resolution math used by the configurator.
 *
 * Wall art is viewed from a normal-room distance, NOT arm's length. Print-
 * shop arm's-length standards (200-300 dpi) are wrong for this product.
 *
 * Calibration:
 *   - 0.5 px/mm  ≈ 13 dpi  → looks crisp on a feature wall from normal
 *                            viewing distance (1m+).
 *   - 0.55 px/mm ≈ 14 dpi  → "good" target.
 *   - 0.2 px/mm  ≈  5 dpi  → genuinely unprintable, the only hard floor.
 *
 * Quality level only ever WARNS the buyer. The configurator never blocks
 * add-to-cart on resolution — that decision is the buyer's, the reprint
 * guarantee covers genuine defects, and most cold traffic uploads phone
 * photos that look fine from a couch.
 */
export const MIN_PX_PER_MM = 0.5;

/** Below this multiple of MIN_PX_PER_MM the image will look genuinely soft. */
export const TOO_LOW_THRESHOLD = MIN_PX_PER_MM * 0.4;   // 0.20 px/mm ≈ 5 dpi

/** Below this multiple the image is borderline — softer up close, fine from across the room. */
export const BORDERLINE_THRESHOLD = MIN_PX_PER_MM * 1.3; // 0.65 px/mm ≈ 16.5 dpi

export type QualityLevel = "good" | "borderline" | "too_low";

export interface QualityResult {
  level:       QualityLevel;
  pxPerMm:     number;
  maxWidthM:   number;
  maxHeightM:  number;
}

export function getQuality(
  imgWidthPx:  number,
  imgHeightPx: number,
  wallWidthM:  number,
  wallHeightM: number,
): QualityResult {
  const widthMm   = wallWidthM  * 1000;
  const heightMm  = wallHeightM * 1000;
  const pxPerMm   = Math.min(imgWidthPx / widthMm, imgHeightPx / heightMm);
  const maxWidthM  = imgWidthPx  / MIN_PX_PER_MM / 1000;
  const maxHeightM = imgHeightPx / MIN_PX_PER_MM / 1000;

  let level: QualityLevel;
  if      (pxPerMm < TOO_LOW_THRESHOLD)    level = "too_low";
  else if (pxPerMm < BORDERLINE_THRESHOLD) level = "borderline";
  else                                     level = "good";

  return { level, pxPerMm, maxWidthM, maxHeightM };
}

/**
 * Format a max-recommended size as a human-friendly string.
 * E.g. (3.21, 2.40) → "320 × 240 cm".
 */
export function formatMaxSizeCm(maxWidthM: number, maxHeightM: number): string {
  return `${Math.floor(maxWidthM * 100)} × ${Math.floor(maxHeightM * 100)} cm`;
}
