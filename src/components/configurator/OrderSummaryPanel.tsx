"use client";

import type { WallpaperType, WallpaperMaterial, ApplicationMethod } from "@/types/order";
import {
  formatZar,
  calculateWallpaperCents,
  calculateInstallationCents,
  getPricePerSqmCents,
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
  widthM:          number;
  heightM:         number;
  wallCount:       number;
  walls?:          { widthM: number; heightM: number }[];
  isMultiDifferent?: boolean;
  totalSqm:        number;
  wallpaperType:   WallpaperType;
  material:        WallpaperMaterial;
  application:     ApplicationMethod;
  canAddToCart:    boolean;
  blockedReason:   string | null;
  onAddToCart:     () => void;
};

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-pw-stone py-2.5 last:border-0">
      <span className="pw-small shrink-0 text-pw-muted">{label}</span>
      <span className="pw-small text-right text-pw-ink">{value}</span>
    </div>
  );
}

export function OrderSummaryPanel({
  imagePreviewUrl,
  widthM,
  heightM,
  wallCount,
  walls,
  isMultiDifferent,
  totalSqm,
  wallpaperType,
  material,
  application,
  canAddToCart,
  blockedReason,
  onAddToCart,
}: Props) {
  const wallpaperCents    = calculateWallpaperCents(totalSqm, wallpaperType, material);
  const installationCents = calculateInstallationCents(application, totalSqm);
  const subtotalCents     = wallpaperCents + installationCents;
  const pricePerSqmCents  = getPricePerSqmCents(wallpaperType, material);
  const hasDetails        = totalSqm > 0;

  // Build the "Size" line. Multi-wall "different" mode shows per-wall when
  // it fits; falls back to "N walls (varied)" otherwise.
  const widthCm  = widthM  > 0 ? Math.round(widthM  * 100) : 0;
  const heightCm = heightM > 0 ? Math.round(heightM * 100) : 0;

  let dimText: string;
  if (isMultiDifferent && walls && walls.length > 0 && walls.every((w) => w.widthM > 0 && w.heightM > 0)) {
    const allSame = walls.every((w) =>
      Math.round(w.widthM  * 100) === Math.round(walls[0].widthM  * 100) &&
      Math.round(w.heightM * 100) === Math.round(walls[0].heightM * 100)
    );
    if (allSame) {
      const w0 = Math.round(walls[0].widthM  * 100);
      const h0 = Math.round(walls[0].heightM * 100);
      dimText = `${w0} × ${h0} cm × ${walls.length} · ${totalSqm.toFixed(1)} m²`;
    } else if (walls.length <= 2) {
      dimText = walls
        .map((w) => `${Math.round(w.widthM * 100)} × ${Math.round(w.heightM * 100)} cm`)
        .join(" + ") + ` · ${totalSqm.toFixed(1)} m²`;
    } else {
      dimText = `${walls.length} walls (varied) · ${totalSqm.toFixed(1)} m²`;
    }
  } else if (widthCm > 0 && heightCm > 0) {
    dimText = `${widthCm} × ${heightCm} cm${wallCount > 1 ? ` × ${wallCount}` : ""} · ${totalSqm.toFixed(1)} m²`;
  } else {
    dimText = "Not set yet";
  }

  const installationLabel =
    application === "diy"             ? "Free"
    : application === "diy_kit"       ? formatZar(60000)
    : application === "pro_installer" ? formatZar(installationCents)
    : "—";

  return (
    <div className="lg:sticky lg:top-6">
      <div className="overflow-hidden rounded-pw-card border border-pw-stone bg-pw-surface">
        {/* Image preview — desktop only, less vertical real estate on mobile */}
        <div className="relative hidden aspect-video bg-pw-bg lg:block">
          {imagePreviewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imagePreviewUrl}
              alt="Your design"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-pw-stone">
                <svg className="h-5 w-5 text-pw-muted-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5M3.75 3h16.5"
                  />
                </svg>
              </div>
              <p className="pw-small text-center text-pw-muted-light">
                Add an image to see it here
              </p>
            </div>
          )}
        </div>

        <div className="p-5 sm:p-6">
          <p className="pw-overline text-pw-muted">Your wallpaper</p>

          <div className="mt-3">
            <SummaryRow label="Size"         value={dimText} />
            <SummaryRow label="Type"         value={TYPE_LABELS[wallpaperType]} />
            <SummaryRow label="Material"     value={`${MATERIAL_LABELS[material]} · ${formatZar(pricePerSqmCents)}/m²`} />
            <SummaryRow label="Installation" value={`${APPLICATION_LABELS[application]} · ${installationLabel}`} />
          </div>

          {/* Price breakdown */}
          <div className="mt-5 space-y-1.5 border-t border-pw-stone pt-5">
            {hasDetails ? (
              <>
                <div className="flex justify-between pw-small text-pw-muted">
                  <span>
                    Wallpaper
                    <span className="ml-1 text-pw-muted-light">({totalSqm.toFixed(1)} m²)</span>
                  </span>
                  <span>{formatZar(wallpaperCents)}</span>
                </div>
                {installationCents > 0 && (
                  <div className="flex justify-between pw-small text-pw-muted">
                    <span>Installation</span>
                    <span>{formatZar(installationCents)}</span>
                  </div>
                )}
                <div className="flex justify-between pw-small text-pw-muted">
                  <span>Shipping</span>
                  <span className="font-medium text-pw-accent">Free</span>
                </div>
                <div className="mt-3 flex items-baseline justify-between border-t border-pw-stone pt-3">
                  <span className="pw-small font-semibold text-pw-ink">Total</span>
                  <span className="pw-h2 text-pw-ink">{formatZar(subtotalCents)}</span>
                </div>
              </>
            ) : (
              <p className="pw-small text-pw-muted">Enter your wall size to see pricing.</p>
            )}
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!canAddToCart}
            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-pw bg-pw-ink pw-body font-semibold text-white transition-colors hover:bg-pw-ink-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {canAddToCart ? "Add to cart" : "Continue setting up"}
          </button>
          {!canAddToCart && blockedReason && (
            <p className="mt-2 pw-small text-center text-pw-muted">{blockedReason}</p>
          )}
          {canAddToCart && (
            <p className="mt-2 pw-small text-center text-pw-muted-light">
              No payment yet — you&rsquo;ll review everything before paying.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
