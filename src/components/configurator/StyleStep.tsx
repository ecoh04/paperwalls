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
    textureClass: "bg-gradient-to-br from-stone-200 via-stone-300 to-stone-200",
  },
  {
    id: "matte",
    label: "Matte",
    description: "Non-reflective. Hides minor wall imperfections. Great for bedrooms.",
    textureClass: "bg-stone-300",
  },
  {
    id: "linen",
    label: "Linen",
    description: "Textured fabric finish. Adds depth and tactile warmth to any space.",
    textureClass:
      "bg-stone-200 [background-image:repeating-linear-gradient(0deg,transparent,transparent_3px,rgba(0,0,0,.06)_3px,rgba(0,0,0,.06)_4px),repeating-linear-gradient(90deg,transparent,transparent_3px,rgba(0,0,0,.04)_3px,rgba(0,0,0,.04)_4px)]",
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
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      {/* Step header */}
      <div className="flex items-start gap-4 mb-6">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-bold text-white">
          4
        </span>
        <div>
          <h2 className="text-xl font-semibold text-stone-900">Wallpaper type &amp; material</h2>
          <p className="mt-1 text-sm text-stone-500">
            Choose how it's applied and what it feels like. Price updates live.
          </p>
        </div>
      </div>

      {/* ── Type toggle ── */}
      <div>
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">
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
                  "flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all touch-manipulation min-h-[44px]",
                  isSelected
                    ? "border-stone-900 bg-stone-900 text-white ring-2 ring-stone-900 ring-offset-1"
                    : "border-stone-200 bg-stone-50 hover:border-stone-400 hover:bg-white",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={["text-base font-bold", isSelected ? "text-white" : "text-stone-900"].join(" ")}>
                    {t.label}
                  </span>
                  <span className={[
                    "text-[10px] font-semibold rounded-full px-2 py-0.5 uppercase tracking-wide",
                    isSelected ? "bg-white/20 text-white" : "bg-stone-200 text-stone-600",
                  ].join(" ")}>
                    {t.tagline}
                  </span>
                </div>
                <p className={["text-xs leading-snug", isSelected ? "text-white/75" : "text-stone-500"].join(" ")}>
                  {t.description}
                </p>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowDifference((v) => !v)}
          className="mt-3 text-xs font-medium text-stone-500 hover:text-stone-800 underline underline-offset-2 transition-colors"
        >
          {showDifference ? "Hide explanation" : "What's the difference?"}
        </button>
        {showDifference && (
          <div className="mt-3 rounded-xl border border-stone-100 bg-stone-50 p-4 text-sm text-stone-600 leading-relaxed space-y-2">
            <p>
              <strong className="text-stone-900">Traditional</strong> uses adhesive paste applied to the wall before hanging. It&apos;s the industry standard — more permanent, cleaner seam lines.
            </p>
            <p>
              <strong className="text-stone-900">Peel &amp; Stick</strong> has a self-adhesive backing. Peel, press, reposition. No paste. Ideal for renters or anyone who might want to change it later.
            </p>
          </div>
        )}
      </div>

      {/* ── Material selector ── */}
      <div className="mt-8">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-3">
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
                  "flex flex-col rounded-2xl border p-4 text-left transition-all touch-manipulation min-h-[44px]",
                  isSelected
                    ? "border-stone-900 bg-white ring-2 ring-stone-900 ring-offset-1 shadow-sm"
                    : "border-stone-200 bg-stone-50 hover:border-stone-400 hover:bg-white hover:shadow-sm",
                ].join(" ")}
              >
                {/* Texture swatch */}
                <div
                  className={["w-full h-16 rounded-xl border border-stone-200 overflow-hidden mb-3", m.textureClass].join(" ")}
                  aria-hidden
                />
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="text-base font-bold text-stone-900">{m.label}</span>
                  {m.badge && (
                    <span className="text-[9px] font-bold uppercase tracking-wide bg-stone-900 text-white rounded-full px-2 py-0.5 shrink-0">
                      {m.badge}
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 leading-snug mb-3">{m.description}</p>
                <div className="mt-auto border-t border-stone-100 pt-3">
                  <p className="text-xs text-stone-400">{formatZar(pricePerSqm)}/m²</p>
                  <p className="text-base font-bold text-stone-900">
                    {formatZar(totalCents)}
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
