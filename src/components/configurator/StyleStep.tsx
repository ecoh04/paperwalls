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
    description: "Self-adhesive backing — no paste needed. Repositionable and removable. Perfect for renters or temporary installs.",
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
    description: "Subtle sheen. Durable and easy to clean. Ideal for living areas.",
    textureClass: "bg-gradient-to-br from-pw-stone via-pw-stone-dark to-pw-stone",
  },
  {
    id: "matte",
    label: "Matte",
    description: "Non-reflective. Hides minor wall imperfections. Great for bedrooms.",
    textureClass: "bg-pw-stone",
  },
  {
    id: "linen",
    label: "Linen",
    description: "Textured fabric finish. Adds depth and tactile warmth to any space.",
    textureClass:
      "bg-pw-stone [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,.07)_3px,rgba(0,0,0,.07)_4px),repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,0,0,.05)_3px,rgba(0,0,0,.05)_4px)]",
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
  totalSqm, wallpaperType, material,
  onWallpaperTypeChange, onMaterialChange,
}: StyleStepProps) {
  const [showDifference, setShowDifference] = useState(false);
  if (totalSqm <= 0) return null;

  return (
    <section className="rounded-pw-card border border-[rgba(26,23,20,0.1)] bg-pw-surface p-5 shadow-pw-sm sm:p-8">
      <div className="flex items-start gap-4 mb-6">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pw-ink text-sm font-bold text-white">
          4
        </span>
        <div>
          <h2 className="text-xl sm:text-2xl font-semibold text-pw-ink">Wallpaper type &amp; material</h2>
          <p className="mt-1 text-sm text-pw-muted">
            Choose how it&apos;s applied and what it feels like. Price updates live.
          </p>
        </div>
      </div>

      {/* ── Type toggle ── */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-pw-muted-light mb-3">
          Application type
        </p>
        <div className="grid grid-cols-2 gap-3">
          {TYPES.map((t) => {
            const isSelected = wallpaperType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onWallpaperTypeChange(t.id)}
                className={[
                  "flex flex-col gap-2 rounded-pw-card border p-4 text-left transition-all touch-manipulation min-h-[44px]",
                  isSelected
                    ? "border-pw-ink bg-pw-surface shadow-pw-sm ring-1 ring-pw-ink/20"
                    : "border-[rgba(26,23,20,0.1)] bg-pw-bg hover:border-pw-stone-dark hover:bg-pw-surface",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-base font-semibold text-pw-ink">{t.label}</span>
                  <span className={[
                    "text-[10px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wide",
                    isSelected ? "bg-pw-ink text-white" : "bg-pw-stone text-pw-muted",
                  ].join(" ")}>
                    {t.tagline}
                  </span>
                </div>
                <p className="text-xs leading-snug text-pw-muted">{t.description}</p>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowDifference((v) => !v)}
          className="mt-3 text-xs font-medium text-pw-muted hover:text-pw-ink underline underline-offset-2 transition-colors"
        >
          {showDifference ? "Hide explanation" : "What's the difference?"}
        </button>
        {showDifference && (
          <div className="mt-3 rounded-pw border border-pw-stone bg-pw-bg p-4 text-sm text-pw-muted leading-relaxed space-y-2">
            <p>
              <strong className="text-pw-ink">Traditional</strong> uses adhesive paste applied to the wall before hanging. Industry standard — more permanent, cleaner seam lines.
            </p>
            <p>
              <strong className="text-pw-ink">Peel &amp; Stick</strong> has a self-adhesive backing. Peel, press, reposition — no paste. Ideal for renters or anyone who may want to update later.
            </p>
          </div>
        )}
      </div>

      {/* ── Material selector ── */}
      <div className="mt-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-pw-muted-light mb-3">
          Material finish
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {MATERIALS.map((m) => {
            const pricePerSqm = getPricePerSqmCents(wallpaperType, m.id);
            const totalCents  = calculateWallpaperCents(totalSqm, wallpaperType, m.id);
            const isSelected  = material === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onMaterialChange(m.id)}
                className={[
                  "flex flex-col rounded-pw-card border p-4 text-left transition-all touch-manipulation min-h-[44px]",
                  isSelected
                    ? "border-pw-ink bg-pw-accent-soft shadow-pw-sm ring-1 ring-pw-ink/25"
                    : "border-[rgba(26,23,20,0.1)] bg-pw-bg hover:border-pw-stone-dark hover:bg-pw-surface hover:shadow-pw-sm",
                ].join(" ")}
              >
                <div className={["w-full h-14 rounded-pw border border-pw-stone overflow-hidden mb-3", m.textureClass].join(" ")} aria-hidden />
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="text-base font-semibold text-pw-ink">{m.label}</span>
                  {m.badge && (
                    <span className="text-[9px] font-bold uppercase tracking-wide bg-pw-accent text-white rounded-full px-2 py-0.5 shrink-0">
                      {m.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-pw-muted leading-snug mb-3">{m.description}</p>
                <div className="mt-auto border-t border-pw-stone pt-3">
                  <p className="text-xs text-pw-muted-light">{formatZar(pricePerSqm)}/m²</p>
                  <p className="text-base font-bold text-pw-ink">{formatZar(totalCents)}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
