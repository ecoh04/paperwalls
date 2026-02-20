"use client";

import { formatZar, calculateSubtotalCents, calculateWallpaperCents, APPLICATION_ADDON_CENTS } from "@/lib/pricing";
import type { WallpaperStyle, ApplicationMethod } from "@/types/order";

const APPLICATION_LABELS: Record<ApplicationMethod, string> = {
  diy: "DIY (you apply)",
  diy_kit: "DIY kit",
  installer: "Pro installer",
};

type PriceSummaryProps = {
  totalSqm: number;
  style: WallpaperStyle;
  application: ApplicationMethod;
  canAddToCart: boolean;
  onAddToCart: () => void;
};

export function PriceSummary({
  totalSqm,
  style,
  application,
  canAddToCart,
  onAddToCart,
}: PriceSummaryProps) {
  const wallpaperCents = calculateWallpaperCents(totalSqm, style);
  const installationCents = APPLICATION_ADDON_CENTS[application];
  const subtotalCents = wallpaperCents + installationCents;

  const mainButton = (
    <button
      type="button"
      onClick={onAddToCart}
      disabled={!canAddToCart}
      className="w-full rounded-full bg-stone-900 py-4 text-base font-medium text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-50 min-h-[48px] touch-manipulation active:bg-stone-700"
    >
      {canAddToCart ? "Add to cart" : "Complete steps above to add to cart"}
    </button>
  );

  return (
    <>
      {/* Sticky bar on mobile */}
      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-stone-200 bg-white p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4">
          <div>
            <p className="text-xs text-stone-500">Total (ex. shipping)</p>
            <p className="text-lg font-bold text-stone-900">{formatZar(subtotalCents)}</p>
          </div>
          <div className="min-w-[140px] shrink-0">{mainButton}</div>
        </div>
      </div>

      {/* Full summary */}
      <section className="rounded-xl border-2 border-stone-900 bg-stone-50 p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-stone-900">Your price</h2>
        <p className="mt-1 text-sm text-stone-600">
          Shipping is calculated at checkout based on your address.
        </p>
        <div className="mt-6 space-y-2 text-sm">
          <div className="flex justify-between text-stone-700">
            <span>Wallpaper ({totalSqm.toFixed(1)} m²)</span>
            <span>{formatZar(wallpaperCents)}</span>
          </div>
          <div className="flex justify-between text-stone-700">
            <span>Installation ({APPLICATION_LABELS[application]})</span>
            <span>{installationCents === 0 ? "FREE" : formatZar(installationCents)}</span>
          </div>
          <div className="flex justify-between text-stone-500">
            <span>Shipping</span>
            <span>At checkout</span>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
          <span className="font-semibold text-stone-900">Total (ex. shipping)</span>
          <span className="text-xl font-bold text-stone-900">{formatZar(subtotalCents)}</span>
        </div>
        <div className="mt-6 hidden md:block">{mainButton}</div>
      </section>
    </>
  );
}
