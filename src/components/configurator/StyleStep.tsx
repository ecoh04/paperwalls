"use client";

import Image from "next/image";
import { useState } from "react";
import type { WallpaperType, WallpaperMaterial } from "@/types/order";
import { formatZar, getPricePerSqmCents, calculateWallpaperCents } from "@/lib/pricing";
import { ConfigStep } from "./ConfigStep";

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
    description: "Self-adhesive backing. No paste needed. Repositionable and removable. Perfect for renters or temporary installs.",
  },
];

const MATERIALS: {
  id: WallpaperMaterial;
  label: string;
  description: string;
  image: string;
  badge?: string;
}[] = [
  {
    id: "satin",
    label: "Satin",
    description: "Subtle sheen. Durable and easy to clean. Ideal for living areas.",
    image: "/images/product/pdp-07-satin.jpg",
  },
  {
    id: "matte",
    label: "Matte",
    description: "Non-reflective. Hides minor wall imperfections. Great for bedrooms.",
    image: "/images/product/pdp-08-matte.jpg",
    badge: "Most ordered",
  },
  {
    id: "linen",
    label: "Linen",
    description: "Textured fabric finish. Adds depth and tactile warmth to any space.",
    image: "/images/product/pdp-09-linen.jpg",
    badge: "Most premium",
  },
];

type StyleStepProps = {
  stepNumber: number;
  totalSqm: number;
  wallpaperType: WallpaperType;
  material: WallpaperMaterial;
  onWallpaperTypeChange: (t: WallpaperType) => void;
  onMaterialChange: (m: WallpaperMaterial) => void;
};

function cardClasses(active: boolean) {
  return [
    "flex flex-col rounded-pw-card border p-4 text-left transition-colors touch-manipulation",
    active
      ? "border-pw-ink bg-pw-surface ring-1 ring-pw-ink/15"
      : "border-pw-stone bg-pw-bg hover:border-pw-ink/40 hover:bg-pw-surface",
  ].join(" ");
}

export function StyleStep({
  stepNumber, totalSqm, wallpaperType, material,
  onWallpaperTypeChange, onMaterialChange,
}: StyleStepProps) {
  const [showDifference, setShowDifference] = useState(false);
  if (totalSqm <= 0) return null;

  return (
    <ConfigStep
      stepNumber={stepNumber}
      eyebrow="Material & finish"
      title="Pick how it sticks and how it feels."
      subtitle="Price updates live as you choose."
    >
      {/* ── Type toggle ── */}
      <div>
        <p className="pw-overline text-pw-ink mb-3">Application type</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {TYPES.map((t) => {
            const active = wallpaperType === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onWallpaperTypeChange(t.id)}
                aria-pressed={active}
                className={[cardClasses(active), "gap-2"].join(" ")}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="pw-body font-semibold text-pw-ink">{t.label}</span>
                  <span className={[
                    "pw-overline rounded-full px-2 py-0.5",
                    active ? "bg-pw-ink text-white" : "bg-pw-stone text-pw-muted",
                  ].join(" ")}>
                    {t.tagline}
                  </span>
                </div>
                <p className="pw-small text-pw-muted">{t.description}</p>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setShowDifference((v) => !v)}
          className="mt-3 pw-small font-medium text-pw-muted underline underline-offset-[6px] decoration-pw-ink/20 hover:text-pw-ink hover:decoration-pw-ink/60 transition-colors"
        >
          {showDifference ? "Hide explanation" : "What's the difference?"}
        </button>
        {showDifference && (
          <div className="mt-3 space-y-2 rounded-pw border border-pw-stone bg-pw-bg p-4 pw-small text-pw-muted leading-relaxed">
            <p>
              <strong className="text-pw-ink">Traditional</strong> uses adhesive paste applied to the wall before hanging. Industry standard. More permanent, cleaner seam lines.
            </p>
            <p>
              <strong className="text-pw-ink">Peel &amp; Stick</strong> has a self-adhesive backing. Peel, press, reposition. No paste. Ideal for renters or anyone who may want to update later.
            </p>
          </div>
        )}
      </div>

      {/* ── Material selector ── */}
      <div className="mt-8">
        <p className="pw-overline text-pw-ink mb-3">Material finish</p>
        <div className="grid gap-3 sm:grid-cols-3">
          {MATERIALS.map((m) => {
            const pricePerSqm = getPricePerSqmCents(wallpaperType, m.id);
            const totalCents  = calculateWallpaperCents(totalSqm, wallpaperType, m.id);
            const active      = material === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => onMaterialChange(m.id)}
                aria-pressed={active}
                className={[
                  "flex flex-col overflow-hidden rounded-pw-card border text-left transition-colors touch-manipulation",
                  active ? "border-pw-ink ring-1 ring-pw-ink/15" : "border-pw-stone hover:border-pw-ink/40",
                ].join(" ")}
              >
                <div className="relative h-24 w-full overflow-hidden bg-pw-stone sm:h-28">
                  <Image
                    src={m.image}
                    alt={`${m.label} finish texture`}
                    fill
                    sizes="(min-width: 640px) 30vw, 100vw"
                    className="object-cover"
                  />
                  {m.badge && (
                    <span className="absolute right-2 top-2 pw-overline rounded-full bg-pw-accent px-2 py-0.5 text-white">
                      {m.badge}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-4">
                  <span className="pw-body font-semibold text-pw-ink">{m.label}</span>
                  <p className="pw-small mt-1 text-pw-muted">{m.description}</p>
                  <div className="mt-auto pt-3">
                    <p className="pw-overline text-pw-muted-light">{formatZar(pricePerSqm)}/m²</p>
                    <p className="pw-h3 text-pw-ink">{formatZar(totalCents)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </ConfigStep>
  );
}
