"use client";

import type { ApplicationMethod } from "@/types/order";
import { formatZar, APPLICATION_ADDON_CENTS } from "@/lib/pricing";

const OPTIONS: { id: ApplicationMethod; label: string; description: string }[] = [
  { id: "diy", label: "DIY", description: "You apply it yourself." },
  { id: "diy_kit", label: "DIY kit", description: "Squeegee, application fluid & instructions included." },
  { id: "installer", label: "Pro installer", description: "We send a professional to your address." },
];

type InstallationStepProps = {
  totalSqm: number;
  application: ApplicationMethod;
  onApplicationChange: (a: ApplicationMethod) => void;
};

export function InstallationStep({
  totalSqm,
  application,
  onApplicationChange,
}: InstallationStepProps) {
  if (totalSqm <= 0) return null;

  return (
    <section className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-stone-900">5. Installation</h2>
      <p className="mt-1 text-sm text-stone-600">
        How do you want to apply the wallpaper?
      </p>
      <div className="mt-6 space-y-3">
        {OPTIONS.map((opt) => {
          const addonCents = APPLICATION_ADDON_CENTS[opt.id];
          const isSelected = application === opt.id;
          const priceLabel = addonCents === 0 ? "FREE" : `+ ${formatZar(addonCents)}`;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onApplicationChange(opt.id)}
              className={`flex w-full min-h-[48px] touch-manipulation flex-col items-start rounded-xl border-2 p-4 text-left transition-colors active:bg-stone-100 sm:flex-row sm:items-center sm:justify-between ${
                isSelected
                  ? "border-stone-900 bg-stone-50"
                  : "border-stone-200 hover:border-stone-300 hover:bg-stone-50"
              }`}
            >
              <div>
                <span className="font-medium text-stone-900">{opt.label}</span>
                <p className="mt-0.5 text-sm text-stone-600">{opt.description}</p>
              </div>
              <span className="mt-2 text-sm font-semibold text-stone-900 sm:mt-0">
                {priceLabel}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
