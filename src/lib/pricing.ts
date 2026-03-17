import type { WallpaperType, WallpaperMaterial, ApplicationMethod } from "@/types/order";

// ─── Wallpaper price matrix (per m², ZAR cents) ──────────────────────────────
const PRICE_MATRIX: Record<WallpaperType, Record<WallpaperMaterial, number>> = {
  traditional: {
    satin: 41000,   // R410/m²
    matte: 47000,   // R470/m²
    linen: 59000,   // R590/m²
  },
  peel_and_stick: {
    satin: 49000,   // R490/m²
    matte: 54000,   // R540/m²
    linen: 68000,   // R680/m²
  },
};

// ─── Installation costs ───────────────────────────────────────────────────────
const DIY_KIT_CENTS = 60000;            // R600 flat (optional add-on)
const PRO_INSTALLER_PER_SQM = 25000;   // R250/m²
const PRO_INSTALLER_CALLOUT = 50000;   // R500 call-out fee

export function getPricePerSqmCents(type: WallpaperType, material: WallpaperMaterial): number {
  return PRICE_MATRIX[type][material];
}

export function calculateWallpaperCents(
  totalSqm: number,
  type: WallpaperType,
  material: WallpaperMaterial
): number {
  if (totalSqm <= 0) return 0;
  return Math.round(totalSqm * PRICE_MATRIX[type][material]);
}

export function calculateInstallationCents(
  application: ApplicationMethod,
  totalSqm: number
): number {
  switch (application) {
    case "diy":           return 0;
    case "diy_kit":       return DIY_KIT_CENTS;
    case "pro_installer": return Math.round(totalSqm * PRO_INSTALLER_PER_SQM) + PRO_INSTALLER_CALLOUT;
    default:              return 0;
  }
}

export function calculateSubtotalCents(
  totalSqm: number,
  type: WallpaperType,
  material: WallpaperMaterial,
  application: ApplicationMethod
): number {
  return (
    calculateWallpaperCents(totalSqm, type, material) +
    calculateInstallationCents(application, totalSqm)
  );
}

export function formatZar(cents: number): string {
  const rands = cents / 100;
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rands);
}

// Kept for any code that needs a quick lookup; pro_installer is dynamic.
export const APPLICATION_ADDON_CENTS: Record<ApplicationMethod, number> = {
  diy:           0,
  diy_kit:       DIY_KIT_CENTS,
  pro_installer: 0, // use calculateInstallationCents for the real value
};
