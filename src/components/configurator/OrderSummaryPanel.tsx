"use client";

import type { WallpaperType, WallpaperMaterial, ApplicationMethod } from "@/types/order";
import {
  formatZar,
  calculateWallpaperCents,
  calculateInstallationCents,
} from "@/lib/pricing";

const TYPE_LABELS: Record<WallpaperType, string> = {
  traditional:   "Traditional",
  peel_and_stick: "Peel & Stick",
};

const MATERIAL_LABELS: Record<WallpaperMaterial, string> = {
  satin: "Satin",
  matte: "Matte",
  linen: "Linen",
};

const APPLICATION_LABELS: Record<ApplicationMethod, string> = {
  diy:           "DIY (self-install)",
  diy_kit:       "DIY + kit",
  pro_installer: "Pro installer",
};

type Props = {
  imagePreviewUrl: string | null;
  widthM: number;
  heightM: number;
  wallCount: number;
  totalSqm: number;
  wallpaperType: WallpaperType;
  material: WallpaperMaterial;
  application: ApplicationMethod;
  canAddToCart: boolean;
  addToCartLabel: string;
  onAddToCart: () => void;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-stone-100 last:border-0">
      <span className="text-sm text-stone-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-stone-900 text-right">{value}</span>
    </div>
  );
}

export function OrderSummaryPanel({
  imagePreviewUrl,
  widthM,
  heightM,
  wallCount,
  totalSqm,
  wallpaperType,
  material,
  application,
  canAddToCart,
  addToCartLabel,
  onAddToCart,
}: Props) {
  const wallpaperCents    = calculateWallpaperCents(totalSqm, wallpaperType, material);
  const installationCents = calculateInstallationCents(application, totalSqm);
  const subtotalCents     = wallpaperCents + installationCents;

  const hasDetails = totalSqm > 0;

  const widthCm  = widthM  > 0 ? `${Math.round(widthM  * 100)} cm` : null;
  const heightCm = heightM > 0 ? `${Math.round(heightM * 100)} cm` : null;
  const dimText  = widthCm && heightCm
    ? `${widthCm} × ${heightCm}${wallCount > 1 ? ` × ${wallCount} walls` : ""} · ${totalSqm.toFixed(1)} m²`
    : "Not set";

  return (
    <>
      {/* ── Desktop sticky panel ──────────────────────────────────────────────── */}
      <div className="hidden lg:block sticky top-6">
        <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
          {/* Image preview */}
          <div className="aspect-video bg-stone-100 relative">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Your design"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center flex-col gap-2 px-6">
                <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5M3.75 3h16.5M3.75 12h.008v.008H3.75V12ZM12 3.75h.008v.008H12V3.75Z"/>
                  </svg>
                </div>
                <p className="text-xs text-stone-400 text-center">Upload an image to see a preview</p>
              </div>
            )}
          </div>

          <div className="p-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-stone-400 mb-3">
              Order summary
            </p>

            {/* Config details */}
            <div>
              <SummaryRow label="Dimensions" value={dimText} />
              <SummaryRow label="Type" value={TYPE_LABELS[wallpaperType]} />
              <SummaryRow label="Material" value={MATERIAL_LABELS[material]} />
              <SummaryRow label="Installation" value={APPLICATION_LABELS[application]} />
            </div>

            {/* Price breakdown */}
            <div className="mt-4 pt-4 border-t border-stone-100 space-y-1.5">
              {hasDetails ? (
                <>
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Wallpaper</span>
                    <span>{formatZar(wallpaperCents)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Installation</span>
                    <span>{installationCents === 0 ? "Free" : formatZar(installationCents)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-stone-500">
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-stone-100">
                    <span className="text-sm font-semibold text-stone-900">Total</span>
                    <span className="text-2xl font-bold text-stone-900">{formatZar(subtotalCents)}</span>
                  </div>
                  <p className="text-xs text-stone-400">Excluding shipping</p>
                </>
              ) : (
                <p className="text-sm text-stone-400">Enter your wall dimensions to see a price.</p>
              )}
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={onAddToCart}
              disabled={!canAddToCart}
              className="mt-5 w-full rounded-xl bg-stone-900 py-3.5 text-base font-semibold text-white hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {canAddToCart ? "Add to cart →" : "Complete all steps to continue"}
            </button>
            {!canAddToCart && (
              <p className="mt-2 text-center text-xs text-stone-400">{addToCartLabel}</p>
            )}
          </div>
        </div>

        {/* Trust badges below panel */}
        <div className="mt-4 space-y-2">
          {[
            { icon: "🏭", text: "Printed in Cape Town" },
            { icon: "✂️", text: "Cut to your exact dimensions" },
            { icon: "📦", text: "Nationwide delivery" },
          ].map((b) => (
            <div key={b.text} className="flex items-center gap-2 text-xs text-stone-500">
              <span>{b.icon}</span>
              <span>{b.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Mobile sticky bottom bar ──────────────────────────────────────────── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-stone-200 bg-white px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="mx-auto flex max-w-lg items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-stone-400 font-medium uppercase tracking-wide">
              Total (excl. shipping)
            </p>
            <p className="text-xl font-bold text-stone-900 leading-none mt-0.5">
              {hasDetails ? formatZar(subtotalCents) : "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!canAddToCart}
            className="shrink-0 rounded-xl bg-stone-900 px-6 py-3 text-sm font-semibold text-white hover:bg-stone-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors min-h-[48px] touch-manipulation"
          >
            {canAddToCart ? "Add to cart →" : "Continue →"}
          </button>
        </div>
      </div>
    </>
  );
}
