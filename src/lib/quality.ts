/**
 * Single source of truth for image-resolution math used by the configurator.
 * Photowall-style threshold: ~21 dpi (≈0.83 px/mm) is the minimum for sharp prints.
 */
export const MIN_PX_PER_MM = 0.83;

/** Below this multiple of MIN_PX_PER_MM the image is too low-res — block ordering. */
export const TOO_LOW_THRESHOLD = MIN_PX_PER_MM * 0.7;

/** Below this multiple the image is borderline — warn but allow. */
export const BORDERLINE_THRESHOLD = MIN_PX_PER_MM * 1.1;

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
