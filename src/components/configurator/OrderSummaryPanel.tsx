"use client";

import type { WallpaperType, WallpaperMaterial, ApplicationMethod } from "@/types/order";
import {
  formatZar,
  calculateWallpaperCents,
  calculateInstallationCents,
} from "@/lib/pricing";

const TYPE_LABELS: Record<WallpaperType, string> = {
  traditional:    "Traditional",
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
    <div className="flex items-start justify-between gap-3 py-2.5 border-b border-[rgba(26,23,20,0.08)] last:border-0">
      <span className="text-sm text-pw-muted shrink-0">{label}</span>
      <span className="text-sm font-medium text-pw-ink text-right">{value}</span>
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
  const hasDetails        = totalSqm > 0;

  const widthCm  = widthM  > 0 ? `${Math.round(widthM  * 100)} cm` : null;
  const heightCm = heightM > 0 ? `${Math.round(heightM * 100)} cm` : null;
  const dimText  = widthCm && heightCm
    ? `${widthCm} × ${heightCm}${wallCount > 1 ? ` × ${wallCount} walls` : ""} · ${totalSqm.toFixed(1)} m²`
    : "Not set";

  return (
    <>
      {/* ── Summary panel — inline on mobile, sticky on desktop ───────────────── */}
      <div className="sticky top-6">
        <div className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface shadow-pw-sm overflow-hidden">
          {/* Image preview — only shown on desktop where space allows */}
          <div className="hidden lg:block aspect-video bg-pw-bg relative">
            {imagePreviewUrl ? (
              <img
                src={imagePreviewUrl}
                alt="Your design"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center flex-col gap-2 px-6">
                <div className="w-10 h-10 rounded-full bg-pw-stone flex items-center justify-center">
                  <svg className="w-5 h-5 text-pw-muted-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                      d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5M3.75 3h16.5"
                    />
                  </svg>
                </div>
                <p className="text-xs text-pw-muted-light text-center">Upload an image to preview</p>
              </div>
            )}
          </div>

          <div className="p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-pw-muted-light mb-3">
              Order summary
            </p>

            <div>
              <SummaryRow label="Dimensions" value={dimText} />
              <SummaryRow label="Type"        value={TYPE_LABELS[wallpaperType]} />
              <SummaryRow label="Material"    value={MATERIAL_LABELS[material]} />
              <SummaryRow label="Installation" value={APPLICATION_LABELS[application]} />
            </div>

            {/* Price breakdown */}
            <div className="mt-4 pt-4 border-t border-[rgba(26,23,20,0.08)] space-y-1.5">
              {hasDetails ? (
                <>
                  <div className="flex justify-between text-sm text-pw-muted">
                    <span>Wallpaper</span>
                    <span>{formatZar(wallpaperCents)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-pw-muted">
                    <span>Installation</span>
                    <span>{installationCents === 0 ? "Free" : formatZar(installationCents)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-pw-muted">
                    <span>Shipping</span>
                    <span className="text-green-600 font-medium">Free</span>
                  </div>
                  <div className="flex items-baseline justify-between mt-3 pt-3 border-t border-[rgba(26,23,20,0.08)]">
                    <span className="text-sm font-semibold text-pw-ink">Total</span>
                    <span className="text-2xl font-bold text-pw-ink">{formatZar(subtotalCents)}</span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-pw-muted">Enter wall dimensions to see your price.</p>
              )}
            </div>

            {/* CTA */}
            <button
              type="button"
              onClick={onAddToCart}
              disabled={!canAddToCart}
              className="mt-5 w-full rounded-pw bg-pw-ink py-3.5 text-base font-medium text-white hover:bg-pw-ink-soft disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {canAddToCart ? "Add to cart →" : "Complete all steps to continue"}
            </button>
            {!canAddToCart && (
              <p className="mt-2 text-center text-xs text-pw-muted">{addToCartLabel}</p>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
