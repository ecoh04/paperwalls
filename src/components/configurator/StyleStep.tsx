"use client";

import type { WallpaperStyle } from "@/types/order";
import { formatZar } from "@/lib/pricing";
import { calculateSubtotalCents, STYLE_MULTIPLIERS } from "@/lib/pricing";

const STYLES: {
  id: WallpaperStyle;
  label: string;
  description: string;
  textureClass: string;
}[] = [
  { id: "matte", label: "Matte", description: "Non-reflective, easy to clean", textureClass: "bg-stone-300" },
  { id: "satin", label: "Satin", description: "Soft sheen, durable", textureClass: "bg-gradient-to-br from-stone-200 to-stone-400" },
  { id: "textured", label: "Textured linen", description: "Subtle texture, premium look", textureClass: "bg-stone-200 bg-[length:10px_10px] [background-image:linear-gradient(45deg,transparent_48%,rgba(0,0,0,.08)_50%,transparent_52%)]" },
  { id: "premium", label: "Premium fabric", description: "Highest quality finish", textureClass: "bg-gradient-to-b from-stone-200 via-stone-300 to-stone-400" },
];

type StyleStepProps = {
  totalSqm: number;
  style: WallpaperStyle;
  application: import("@/types/order").ApplicationMethod;
  onStyleChange: (s: WallpaperStyle) => void;
};

export function StyleStep({ totalSqm, style, application, onStyleChange }: StyleStepProps) {
  if (totalSqm <= 0) return null;

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-stone-900">4. Wallpaper style</h2>
      <p className="mt-1 text-sm text-stone-600">
        Choose the finish. Price updates below for your current size.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {STYLES.map((s) => {
          const cents = calculateSubtotalCents(totalSqm, s.id, application);
          const mult = STYLE_MULTIPLIERS[s.id];
          const isSelected = style === s.id;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onStyleChange(s.id)}
              className={`flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border-2 p-4 text-left transition-colors touch-manipulation min-h-[44px] ${
                isSelected
                  ? "border-stone-900 bg-stone-50"
                  : "border-stone-200 hover:border-stone-300 hover:bg-stone-50 active:bg-stone-100"
              }`}
            >
              <div
                className={`w-full h-20 sm:w-24 sm:h-24 shrink-0 rounded-lg border border-stone-200 overflow-hidden ${s.textureClass}`}
                aria-hidden
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-stone-900">{s.label}</span>
                <span className="mt-0.5 block text-xs text-stone-600">{s.description}</span>
                <span className="mt-2 inline-block text-sm font-semibold text-stone-900">
                  {formatZar(cents)}
                  {mult !== 1 && (
                    <span className="ml-1 font-normal text-stone-500">
                      ({(mult * 100 - 100).toFixed(0)}% more)
                    </span>
                  )}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
