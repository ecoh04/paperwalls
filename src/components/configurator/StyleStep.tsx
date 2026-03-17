"use client";

import { useState } from "react";
import type { WallpaperType, WallpaperMaterial } from "@/types/order";
import { formatZar, getPricePerSqmCents, calculateWallpaperCents } from "@/lib/pricing";

const TYPES: {
  id: WallpaperType;
  label: string;
  tagline: string;
  description: string;
}[] = [
  {
    id: "traditional",
    label: "Traditional",
    tagline: "Paste & hang",
    description: "Applied with adhesive paste. Industry standard, more permanent. Best for feature walls and commercial spaces.",
  },
  {
    id: "peel_and_stick",
    label: "Peel & Stick",
    tagline: "Self-adhesive",
    description: "Self-adhesive backing — no paste needed. Repositionable and removable. Great for renters or temporary installs.",
  },
];

const MATERIALS: {
  id: WallpaperMaterial;
  label: string;
  description: string;
  textureClass: string;
  badge?: string;
}[] = [
  {
    id: "satin",
    label: "Satin",
    description: "Subtle sheen. Durable and easy to clean. Perfect for living areas and hallways.",
    textureClass: "bg-gradient-to-br from-stone-200 via-stone-300 to-stone-200",
  },
  {
    id: "matte",
    label: "Matte",
    description: "Non-reflective finish. Hides minor imperfections. Great for bedrooms and low-light spaces.",
    textureClass: "bg-stone-300",
  },
  {
    id: "linen",
    label: "Linen",
    description: "Textured fabric finish. Adds depth and warmth. A premium look with real tactile presence.",
    textureClass: "bg-stone-200 [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,.06)_3px,rgba(0,0,0,.06)_4px),repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,0,0,.04)_3px,rgba(0,0,0,.04)_4px)]",
    badge: "Most premium",
  },
];

type StyleStepProps = {
  totalSqm: number;
  wallpaperType: WallpaperType;
  material: WallpaperMaterial;
  onWallpaperTypeChange: (t: WallpaperType) => void;
  onMaterialChange: (m: WallpaperMaterial) => void;
};

export function StyleStep({
  totalSqm,
  wallpaperType,
  material,
  onWallpaperTypeChange,
  onMaterialChange,
}: StyleStepProps) {
  const [showDifference, setShowDifference] = useState(false);

  if (totalSqm <= 0) return null;

  return (
    <section className="rounded-pw-card border border-pw-stone bg-pw-surface p-4 sm:p-6 shadow-pw-sm">
      <h2 className="text-lg font-semibold text-pw-ink">3. Wallpaper type &amp; material</h2>
      <p className="mt-1 text-sm text-pw-muted">
        Choose how it's applied and what it feels like. Your price updates as you go.
      </p>

      {/* ── Type toggle ── */}
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-pw-muted mb-2">Application type</p>
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((t) => {
            const isSelected = wallpaperType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onWallpaperTypeChange(t.id)}
                className={`flex flex-col gap-1 rounded-pw-card border p-4 text-left transition-colors touch-manipulation min-h-[44px] ${
                  isSelected
                    ? "border-pw-ink bg-pw-bg ring-1 ring-pw-ink"
                    : "border-pw-stone hover:border-pw-ink hover:bg-pw-bg active:bg-pw-accent-soft"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-pw-ink text-sm">{t.label}</span>
                  <span
                    className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                      isSelected
                        ? "bg-pw-ink text-white"
                        : "bg-pw-stone text-pw-muted"
                    }`}
                  >
                    {t.tagline}
                  </span>
                </div>
                <p className="text-xs text-pw-muted leading-snug">{t.description}</p>
              </button>
            );
          })}
        </div>

        {/* What's the difference? */}
        <button
          type="button"
          onClick={() => setShowDifference((v) => !v)}
          className="mt-2 text-xs text-pw-accent hover:underline"
        >
          {showDifference ? "Hide" : "What's the difference?"}
        </button>
        {showDifference && (
          <div className="mt-2 rounded-lg bg-pw-accent-soft border border-pw-stone p-3 text-xs text-pw-muted leading-relaxed">
            <p><strong className="text-pw-ink">Traditional</strong> uses adhesive paste applied to the wall before hanging. It&apos;s the industry standard for permanent installations and gives the cleanest seam lines.</p>
            <p className="mt-1"><strong className="text-pw-ink">Peel &amp; Stick</strong> has a self-adhesive backing — peel off the liner and press onto the wall. It can be repositioned or removed without damage, making it ideal for renters or temporary installs.</p>
          </div>
        )}
      </div>

      {/* ── Material selector ── */}
      <div className="mt-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-pw-muted mb-2">Material</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {MATERIALS.map((m) => {
            const pricePerSqm = getPricePerSqmCents(wallpaperType, m.id);
            const totalCents = calculateWallpaperCents(totalSqm, wallpaperType, m.id);
            const isSelected = material === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onMaterialChange(m.id)}
                className={`flex flex-col rounded-pw-card border p-3 text-left transition-colors touch-manipulation min-h-[44px] ${
                  isSelected
                    ? "border-pw-ink bg-pw-bg ring-1 ring-pw-ink"
                    : "border-pw-stone hover:border-pw-ink hover:bg-pw-bg active:bg-pw-accent-soft"
                }`}
              >
                {/* Texture swatch */}
                <div
                  className={`w-full h-14 rounded-md border border-pw-stone overflow-hidden mb-3 ${m.textureClass}`}
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-semibold text-pw-ink text-sm">{m.label}</span>
                  {m.badge && (
                    <span className="text-[9px] font-medium bg-pw-accent text-white rounded-full px-1.5 py-0.5 shrink-0">
                      {m.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-pw-muted leading-snug mb-2">{m.description}</p>
                <div className="mt-auto pt-2 border-t border-pw-stone">
                  <p className="text-xs text-pw-muted">
                    {formatZar(pricePerSqm)}/m²
                  </p>
                  <p className="text-sm font-bold text-pw-ink">
                    {formatZar(totalCents)}
                    <span className="text-xs font-normal text-pw-muted ml-1">total</span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
