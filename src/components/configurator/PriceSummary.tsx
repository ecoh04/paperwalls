"use client";

import {
  formatZar,
  calculateWallpaperCents,
  calculateInstallationCents,
} from "@/lib/pricing";
import type { WallpaperType, WallpaperMaterial, ApplicationMethod } from "@/types/order";

const TYPE_LABELS: Record<WallpaperType, string> = {
  traditional: "Traditional",
  peel_and_stick: "Peel & Stick",
};

const MATERIAL_LABELS: Record<WallpaperMaterial, string> = {
  satin: "Satin",
  matte: "Matte",
  linen: "Linen",
};

const APPLICATION_LABELS: Record<ApplicationMethod, string> = {
  diy:           "DIY (you apply)",
  diy_kit:       "DIY + installation kit",
  pro_installer: "Pro installer",
};

type PriceSummaryProps = {
  totalSqm: number;
  wallpaperType: WallpaperType;
  material: WallpaperMaterial;
  application: ApplicationMethod;
  canAddToCart: boolean;
  addToCartLabel: string;
  onAddToCart: () => void;
};

export function PriceSummary({
  totalSqm,
  wallpaperType,
  material,
  application,
  canAddToCart,
  addToCartLabel,
  onAddToCart,
}: PriceSummaryProps) {
  const wallpaperCents = calculateWallpaperCents(totalSqm, wallpaperType, material);
  const installationCents = calculateInstallationCents(application, totalSqm);
  const subtotalCents = wallpaperCents + installationCents;

  const mainButton = (
    <button
      type="button"
      onClick={onAddToCart}
      disabled={!canAddToCart}
      className="w-full rounded-pw bg-pw-ink py-4 text-base font-medium text-white hover:bg-pw-ink-soft disabled:cursor-not-allowed disabled:opacity-50 min-h-[48px] touch-manipulation"
    >
      {addToCartLabel}
    </button>
  );

  return (
    <>
      {/* Sticky bar on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-pw-stone bg-pw-surface p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div>
            <p className="text-xs text-pw-muted">Total (ex. shipping)</p>
            <p className="text-lg font-bold text-pw-ink">{formatZar(subtotalCents)}</p>
          </div>
          <div className="min-w-[140px] shrink-0">{mainButton}</div>
        </div>
      </div>

      {/* Full summary */}
      <section className="rounded-pw-card border border-pw-ink bg-pw-bg p-4 shadow-pw-sm sm:p-6">
        <h2 className="text-lg font-semibold text-pw-ink">Your price</h2>
        <p className="mt-1 text-sm text-pw-muted">
          Shipping is calculated at checkout based on your province.
        </p>
        <div className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between text-pw-muted">
            <span>
              Wallpaper — {TYPE_LABELS[wallpaperType]} {MATERIAL_LABELS[material]}{" "}
              <span className="text-xs">({totalSqm.toFixed(1)} m²)</span>
            </span>
            <span className="text-pw-ink font-medium">{formatZar(wallpaperCents)}</span>
          </div>
          <div className="flex justify-between text-pw-muted">
            <span>{APPLICATION_LABELS[application]}</span>
            <span className="text-pw-ink font-medium">
              {installationCents === 0 ? "Free" : formatZar(installationCents)}
            </span>
          </div>
          <div className="flex justify-between text-pw-muted">
            <span>Shipping</span>
            <span>Calculated at checkout</span>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between border-t border-pw-stone pt-4">
          <span className="font-semibold text-pw-ink">Total (ex. shipping)</span>
          <span className="text-xl font-bold text-pw-ink">{formatZar(subtotalCents)}</span>
        </div>
        <div className="mt-6 hidden md:block">{mainButton}</div>
      </section>
    </>
  );
}
